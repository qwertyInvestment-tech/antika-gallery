import { ItemStatus, MediaKind, Prisma } from "@prisma/client";
import { tokenizeAdminSearch } from "@/lib/catalog/admin-search";
import { prisma } from "@/lib/db/prisma";
import { formatItemReference } from "@/lib/domain/reference-number";
import { ADMIN_ITEM_PAGE_SIZE, type ItemListQuery } from "@/lib/validation/item";
import { refreshExpiredReservations } from "@/server/services/commerce-service";

const listSelect = {
  id: true,
  referenceNumber: true,
  title: true,
  slug: true,
  price: true,
  currency: true,
  status: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  images: {
    where: { isPrimary: true, asset: { kind: MediaKind.IMAGE } },
    take: 1,
    select: {
      id: true,
      isPrimary: true,
      asset: { select: { url: true, alt: true, kind: true } },
    },
  },
} satisfies Prisma.ItemSelect;

export async function allocateReferenceNumber(tx: Prisma.TransactionClient = prisma) {
  const counter = await tx.referenceCounter.upsert({
    where: { key: "item" },
    update: { lastNumber: { increment: 1 } },
    create: { key: "item", lastNumber: 1 },
  });
  return formatItemReference(counter.lastNumber);
}

export async function findItemById(id: string) {
  await refreshExpiredReservations();
  return prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
        include: { asset: true },
      },
    },
  });
}

export async function findItemBySlug(slug: string) {
  return prisma.item.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, include: { asset: true } },
    },
  });
}

export async function findItemByReference(referenceNumber: string) {
  return prisma.item.findUnique({ where: { referenceNumber } });
}

export async function slugExists(slug: string, excludeId?: string) {
  const found = await prisma.item.findUnique({ where: { slug }, select: { id: true } });
  if (!found) return false;
  return found.id !== excludeId;
}

function adminItemWhere(query: ItemListQuery): Prisma.ItemWhereInput {
  const where: Prisma.ItemWhereInput = {};
  const tokens = tokenizeAdminSearch(query.q);
  if (tokens.length > 0) {
    where.AND = tokens.map((token) => ({
      OR: [
        { title: { contains: token, mode: "insensitive" } },
        { referenceNumber: { contains: token, mode: "insensitive" } },
      ],
    }));
  }
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.status) where.status = query.status;
  return where;
}

export async function listAdminItems(query: ItemListQuery) {
  const where = adminItemWhere(query);
  const total = await prisma.item.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_ITEM_PAGE_SIZE));
  const page = Math.min(query.page ?? 1, pageCount);
  const items = await prisma.item.findMany({
    where,
    select: listSelect,
    orderBy: { [query.sort]: query.order },
    skip: (page - 1) * ADMIN_ITEM_PAGE_SIZE,
    take: ADMIN_ITEM_PAGE_SIZE,
  });
  return { items, total, page, pageCount, pageSize: ADMIN_ITEM_PAGE_SIZE };
}

export async function listPublicItems(options?: { categoryId?: string; includeSold?: boolean }) {
  const statuses: ItemStatus[] = [
    ItemStatus.PUBLISHED,
    ItemStatus.AVAILABLE,
    ItemStatus.RESERVED,
  ];
  if (options?.includeSold) statuses.push(ItemStatus.SOLD);

  return prisma.item.findMany({
    where: {
      status: { in: statuses },
      ...(options?.categoryId ? { categoryId: options.categoryId } : {}),
    },
    select: listSelect,
    orderBy: { publishedAt: "desc" },
  });
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      parent: { select: { id: true, name: true } },
    },
  });
}
