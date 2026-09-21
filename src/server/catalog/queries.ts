import { ItemStatus, MediaKind, Prisma } from "@prisma/client";
import { categoryEditorials } from "@/content/catalog/category-visuals";
import { PUBLIC_ITEM_STATUSES, type PublicCatalogFilters } from "@/lib/catalog/public-query";
import { prisma } from "@/lib/db/prisma";
import { isPubliclyVisibleStatus } from "@/lib/domain/item-status";
import { refreshExpiredReservations } from "@/server/services/commerce-service";

const publicListInclude = {
  category: { select: { id: true, name: true, slug: true, description: true } },
  images: {
    where: { asset: { kind: MediaKind.IMAGE } },
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    take: 1,
    include: { asset: { select: { url: true, alt: true, kind: true } } },
  },
};

const publicDetailInclude = {
  category: { select: { id: true, name: true, slug: true, description: true } },
  images: {
    orderBy: { sortOrder: "asc" as const },
    include: { asset: { select: { url: true, alt: true, kind: true, mimeType: true, durationSeconds: true } } },
  },
};

function isPublicCatalogStatus(status: ItemStatus): status is (typeof PUBLIC_ITEM_STATUSES)[number] {
  return (PUBLIC_ITEM_STATUSES as readonly ItemStatus[]).includes(status);
}

function publicStatusWhere(status?: ItemStatus): Prisma.ItemWhereInput["status"] {
  if (status && isPublicCatalogStatus(status)) return status;
  return { in: [...PUBLIC_ITEM_STATUSES] };
}

export async function listPublicSitemapEntries() {
  const [items, categories] = await Promise.all([
    prisma.item.findMany({
      where: { status: { in: [...PUBLIC_ITEM_STATUSES] } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);
  return { items, categories };
}

export async function getPublishedItems() {
  await refreshExpiredReservations();
  return prisma.item.findMany({
    where: { status: { in: [...PUBLIC_ITEM_STATUSES] } },
    include: publicDetailInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function getItemBySlug(slug: string) {
  await refreshExpiredReservations();
  const item = await prisma.item.findUnique({
    where: { slug },
    include: publicDetailInclude,
  });
  if (!item || !isPubliclyVisibleStatus(item.status)) {
    return null;
  }
  return item;
}

export async function getCategoryItems(categorySlug: string) {
  return prisma.item.findMany({
    where: {
      category: { slug: categorySlug },
      status: { in: [...PUBLIC_ITEM_STATUSES] },
    },
    include: publicListInclude,
    orderBy: { publishedAt: "desc" },
  });
}

export async function getFeaturedItems(take = 1) {
  await refreshExpiredReservations();
  return prisma.item.findMany({
    where: { status: ItemStatus.AVAILABLE },
    include: publicDetailInclude,
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function getRecentPublicItems(take = 3) {
  return prisma.item.findMany({
    where: { status: { in: [...PUBLIC_ITEM_STATUSES] } },
    include: publicListInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export async function getPublicCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      _count: {
        select: {
          items: { where: { status: { in: [...PUBLIC_ITEM_STATUSES] } } },
        },
      },
    },
  });
}

export async function getPublicCategoryBySlug(slug: string) {
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
    },
  });
  if (!category) return null;
  return {
    ...category,
    description: category.description || categoryEditorials[category.slug] || null,
  };
}

export async function searchPublicCatalog(filters: PublicCatalogFilters) {
  await refreshExpiredReservations();
  const where: Prisma.ItemWhereInput = {
    status: publicStatusWhere(filters.status),
  };

  if (filters.categorySlug) {
    where.category = { slug: filters.categorySlug, isActive: true };
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { referenceNumber: { contains: filters.q, mode: "insensitive" } },
      { maker: { contains: filters.q, mode: "insensitive" } },
      { origin: { contains: filters.q, mode: "insensitive" } },
      { periodLabel: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.period) where.periodLabel = { contains: filters.period, mode: "insensitive" };
  if (filters.origin) where.origin = { contains: filters.origin, mode: "insensitive" };
  if (filters.material) where.material = { contains: filters.material, mode: "insensitive" };

  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) where.price.gte = new Prisma.Decimal(filters.minPrice);
    if (filters.maxPrice) where.price.lte = new Prisma.Decimal(filters.maxPrice);
  }

  const orderBy: Prisma.ItemOrderByWithRelationInput[] =
    filters.sort === "price-asc"
      ? [{ price: "asc" }, { publishedAt: "desc" }]
      : filters.sort === "price-desc"
        ? [{ price: "desc" }, { publishedAt: "desc" }]
        : [{ publishedAt: "desc" }, { createdAt: "desc" }];

  const skip = (filters.page - 1) * filters.pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.item.findMany({
      where,
      include: publicListInclude,
      orderBy,
      skip,
      take: filters.pageSize,
    }),
    prisma.item.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function getPublicItemsByIds(ids: string[]) {
  await refreshExpiredReservations();
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 60);
  if (unique.length === 0) return [];

  const items = await prisma.item.findMany({
    where: {
      id: { in: unique },
      status: { in: [...PUBLIC_ITEM_STATUSES] },
    },
    include: publicListInclude,
  });

  const byId = new Map(items.map((item) => [item.id, item]));
  return unique.map((id) => byId.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export type PublicCatalogItem = Awaited<ReturnType<typeof searchPublicCatalog>>["items"][number];
export type PublicItemDetail = NonNullable<Awaited<ReturnType<typeof getItemBySlug>>>;
