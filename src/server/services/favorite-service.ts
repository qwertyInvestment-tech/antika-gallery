import { prisma } from "@/lib/db/prisma";
import { isPubliclyVisibleStatus } from "@/lib/domain/item-status";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";
import { getPublicItemsByIds } from "@/server/catalog/queries";

export async function listFavoriteIds(userId: string) {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { itemId: true },
  });
  return rows.map((row) => row.itemId);
}

export async function listFavoriteItems(userId: string) {
  return getPublicItemsByIds(await listFavoriteIds(userId));
}

export async function addFavoriteForUser(userId: string, itemId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, status: true },
  });
  if (!item || !isPubliclyVisibleStatus(item.status)) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Предметот не е пронајден.", 404);
  }

  await prisma.favorite.upsert({
    where: { userId_itemId: { userId, itemId } },
    update: {},
    create: { userId, itemId },
  });
  return listFavoriteIds(userId);
}

export async function removeFavoriteForUser(userId: string, itemId: string) {
  await prisma.favorite.deleteMany({ where: { userId, itemId } });
  return listFavoriteIds(userId);
}

export async function mergeAnonymousFavorites(userId: string, itemIds: string[]) {
  const unique = [...new Set(itemIds.filter((id) => typeof id === "string" && id.length > 0))];
  if (unique.length === 0) return listFavoriteIds(userId);

  const items = await prisma.item.findMany({
    where: { id: { in: unique }, status: { in: ["PUBLISHED", "AVAILABLE", "RESERVED", "SOLD"] } },
    select: { id: true },
  });
  const validIds = items.map((row) => row.id);
  if (validIds.length === 0) return listFavoriteIds(userId);

  await prisma.favorite.createMany({
    data: validIds.map((itemId) => ({ userId, itemId })),
    skipDuplicates: true,
  });
  return listFavoriteIds(userId);
}
