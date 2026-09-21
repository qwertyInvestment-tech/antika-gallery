import { ItemStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  assertItemStatusTransition,
  canHardDeleteItem,
  isCatalogArchivable,
  isPubliclyVisibleStatus,
} from "@/lib/domain/item-status";
import { slugifyTitle } from "@/lib/domain/slug";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";
import { itemWriteSchema, type ItemWriteInput } from "@/lib/validation/item";
import {
  allocateReferenceNumber,
  findItemById,
  slugExists,
} from "@/server/repositories/item-repository";
import { getStorageForProvider } from "@/lib/storage";

const PUBLIC_NEEDS_COPY: ItemStatus[] = [
  ItemStatus.PUBLISHED,
  ItemStatus.AVAILABLE,
  ItemStatus.RESERVED,
  ItemStatus.SOLD,
];

function toDecimal(price: string) {
  return new Prisma.Decimal(price);
}

function assertNotCommerceStatus(status: ItemStatus) {
  if (status === ItemStatus.RESERVED || status === ItemStatus.SOLD) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      "Резервацијата и продажбата се прават преку резервацискиот тек.",
      400,
    );
  }
}

function assertPublishReady(input: { slug: string; shortDescription?: string | null; status: ItemStatus }) {
  if (!PUBLIC_NEEDS_COPY.includes(input.status)) return;
  if (!input.slug) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Објавениот предмет мора да има slug.", 400);
  }
  if (!input.shortDescription) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Објавениот предмет мора да има краток опис.", 400);
  }
}

async function uniqueSlug(base: string, excludeId?: string) {
  let candidate = base || "predmet";
  let n = 2;
  while (await slugExists(candidate, excludeId)) {
    candidate = `${base.slice(0, 170)}-${n}`;
    n += 1;
  }
  return candidate;
}

export async function createItem(raw: unknown) {
  const parsed = itemWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      parsed.error.issues[0]?.message ?? "Невалидни податоци за предмет.",
      400,
    );
  }

  const input = parsed.data;
  assertNotCommerceStatus(input.status);
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Категоријата не постои.", 400);
  }

  return prisma.$transaction(async (tx) => {
    const referenceNumber = await allocateReferenceNumber(tx);
    const requestedSlug = input.slug && input.slug.length > 0 ? input.slug : slugifyTitle(input.title);
    const slug = await uniqueSlug(requestedSlug || slugifyTitle(referenceNumber));

    assertPublishReady({
      slug,
      shortDescription: input.shortDescription,
      status: input.status,
    });

    if (input.status !== ItemStatus.DRAFT) {
      assertItemStatusTransition(ItemStatus.DRAFT, input.status);
    }

    return tx.item.create({
      data: {
        referenceNumber,
        slug,
        title: input.title,
        categoryId: input.categoryId,
        shortDescription: input.shortDescription,
        description: input.description,
        price: toDecimal(input.price),
        currency: input.currency,
        status: input.status,
        periodLabel: input.periodLabel,
        origin: input.origin,
        maker: input.maker,
        provenance: input.provenance,
        material: input.material,
        condition: input.condition ?? null,
        conditionNotes: input.conditionNotes,
        dimensions: input.dimensions,
        weight: input.weight,
        authenticityNotes: input.authenticityNotes,
        documentationNotes: input.documentationNotes,
        expertNotes: input.expertNotes,
        certificateNotes: input.certificateNotes,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        publishedAt: isPubliclyVisibleStatus(input.status) ? new Date() : null,
        soldAt: input.status === ItemStatus.SOLD ? new Date() : null,
      },
    });
  });
}

export async function updateItem(id: string, raw: unknown) {
  const existing = await findItemById(id);
  if (!existing) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Предметот не е пронајден.", 404);
  }

  const parsed = itemWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      parsed.error.issues[0]?.message ?? "Невалидни податоци за предмет.",
      400,
    );
  }

  const input = parsed.data;
  if (input.status !== existing.status) {
    assertNotCommerceStatus(input.status);
  }
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Категоријата не постои.", 400);
  }

  assertItemStatusTransition(existing.status, input.status);

  const slug =
    input.slug && input.slug.length > 0
      ? await uniqueSlug(input.slug, existing.id)
      : existing.slug;

  assertPublishReady({
    slug,
    shortDescription: input.shortDescription,
    status: input.status,
  });

  return prisma.item.update({
    where: { id },
    data: {
      title: input.title,
      slug,
      categoryId: input.categoryId,
      shortDescription: input.shortDescription,
      description: input.description,
      price: toDecimal(input.price),
      currency: input.currency,
      status: input.status,
      periodLabel: input.periodLabel,
      origin: input.origin,
      maker: input.maker,
      provenance: input.provenance,
      material: input.material,
      condition: input.condition ?? null,
      conditionNotes: input.conditionNotes,
      dimensions: input.dimensions,
      weight: input.weight,
      authenticityNotes: input.authenticityNotes,
      documentationNotes: input.documentationNotes,
      expertNotes: input.expertNotes,
      certificateNotes: input.certificateNotes,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt:
        isPubliclyVisibleStatus(input.status) && !existing.publishedAt ? new Date() : existing.publishedAt,
      soldAt: input.status === ItemStatus.SOLD ? existing.soldAt ?? new Date() : existing.soldAt,
    },
  });
}

export async function changeItemStatus(id: string, status: ItemStatus) {
  const existing = await findItemById(id);
  if (!existing) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Предметот не е пронајден.", 404);
  }

  if (status === ItemStatus.RESERVED || status === ItemStatus.SOLD) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      "Резервацијата и продажбата се прават преку резервацискиот тек.",
      400,
    );
  }

  assertItemStatusTransition(existing.status, status);
  assertPublishReady({
    slug: existing.slug,
    shortDescription: existing.shortDescription,
    status,
  });

  return prisma.item.update({
    where: { id },
    data: {
      status,
      publishedAt:
        isPubliclyVisibleStatus(status) && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });
}

export async function getItemCommerceGuards(itemId: string) {
  const [reservationCount, orderItemCount] = await Promise.all([
    prisma.reservation.count({ where: { itemId } }),
    prisma.orderItem.count({ where: { itemId } }),
  ]);
  return {
    reservationCount,
    orderItemCount,
    hasCommerceHistory: reservationCount > 0 || orderItemCount > 0,
  };
}

export async function archiveItem(id: string) {
  const existing = await findItemById(id);
  if (!existing) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Предметот не е пронајден.", 404);
  }
  if (!isCatalogArchivable(existing.status)) {
    throw new AppError(
      APP_ERROR_CODES.INVALID_STATUS_TRANSITION,
      existing.status === ItemStatus.RESERVED
        ? "Прво откажете ја резервацијата пред архивирање."
        : existing.status === ItemStatus.SOLD
          ? "Продаден предмет не се архивира преку каталог статус."
          : "Предметот не може да се архивира.",
      409,
    );
  }
  return changeItemStatus(id, ItemStatus.ARCHIVED);
}

export async function deleteItem(id: string) {
  const existing = await findItemById(id);
  if (!existing) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Предметот не е пронајден.", 404);
  }

  const guards = await getItemCommerceGuards(id);
  if (!canHardDeleteItem(existing.status, guards.hasCommerceHistory)) {
    throw new AppError(
      APP_ERROR_CODES.CONFLICT,
      "Предметот не може да се избрише бидејќи има историја на продажба или резервација.",
      409,
    );
  }

  const storageTargets = existing.images.map((image) => ({
    provider: image.asset.provider,
    key: image.asset.key,
    url: image.asset.url,
  }));
  const assetIds = existing.images.map((image) => image.asset.id);

  await prisma.$transaction(async (tx) => {
    await tx.itemImage.deleteMany({ where: { itemId: id } });
    await tx.favorite.deleteMany({ where: { itemId: id } });
    await tx.inquiry.updateMany({ where: { itemId: id }, data: { itemId: null } });
    if (assetIds.length > 0) {
      await tx.mediaAsset.deleteMany({ where: { id: { in: assetIds } } });
    }
    await tx.item.delete({ where: { id } });
  });

  await Promise.all(
    storageTargets.map(async (asset) => {
      try {
        const storage = getStorageForProvider(asset.provider);
        await storage.delete(asset.provider === "BLOB" ? asset.url : asset.key);
      } catch {
        // Best-effort cleanup after DB delete.
      }
    }),
  );
  return { id };
}

export type BulkArchiveResult = {
  archivedIds: string[];
  blocked: Array<{ id: string; referenceNumber: string; title: string; status: ItemStatus; reason: string }>;
};

export async function bulkArchiveItems(ids: string[]): Promise<BulkArchiveResult> {
  if (ids.length === 0) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Нема избрани предмети.", 400);
  }

  const items = await prisma.item.findMany({
    where: { id: { in: ids } },
    select: { id: true, referenceNumber: true, title: true, status: true },
  });
  if (items.length !== ids.length) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Некои од избраните предмети не постојат.", 404);
  }

  const blocked = items
    .filter((item) => !isCatalogArchivable(item.status))
    .map((item) => ({
      ...item,
      reason:
        item.status === ItemStatus.RESERVED || item.status === ItemStatus.SOLD
          ? "резервирани или продадени"
          : "не може да се архивираат од тековниот статус",
    }));

  if (blocked.length > 0) {
    throw new AppError(
      APP_ERROR_CODES.CONFLICT,
      `${blocked.length} предмети не можат да се архивираат бидејќи се резервирани или продадени.`,
      409,
      { blocked },
    );
  }

  const archivedIds: string[] = [];
  for (const item of items) {
    if (item.status === ItemStatus.ARCHIVED) {
      archivedIds.push(item.id);
      continue;
    }
    await changeItemStatus(item.id, ItemStatus.ARCHIVED);
    archivedIds.push(item.id);
  }

  return { archivedIds, blocked: [] };
}

export type BulkDeleteResult = {
  deletedIds: string[];
  blocked: Array<{ id: string; referenceNumber: string; title: string; reason: string }>;
};

export async function bulkDeleteItems(ids: string[]): Promise<BulkDeleteResult> {
  if (ids.length === 0) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Нема избрани предмети.", 400);
  }

  const items = await prisma.item.findMany({
    where: { id: { in: ids } },
    select: { id: true, referenceNumber: true, title: true, status: true },
  });
  if (items.length !== ids.length) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Некои од избраните предмети не постојат.", 404);
  }

  const blocked: BulkDeleteResult["blocked"] = [];
  for (const item of items) {
    const guards = await getItemCommerceGuards(item.id);
    if (!canHardDeleteItem(item.status, guards.hasCommerceHistory)) {
      blocked.push({
        id: item.id,
        referenceNumber: item.referenceNumber,
        title: item.title,
        reason: "има историја на продажба или резервација",
      });
    }
  }

  if (blocked.length > 0) {
    throw new AppError(
      APP_ERROR_CODES.CONFLICT,
      `Предметот не може да се избрише бидејќи има историја на продажба или резервација.`,
      409,
      { blocked },
    );
  }

  const deletedIds: string[] = [];
  for (const item of items) {
    await deleteItem(item.id);
    deletedIds.push(item.id);
  }

  return { deletedIds, blocked: [] };
}

export type { ItemWriteInput };
