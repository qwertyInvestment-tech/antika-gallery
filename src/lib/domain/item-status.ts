import { ItemStatus } from "@prisma/client";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";
import { itemStatusLabels } from "@/lib/domain/labels";

/**
 * Catalog-owned transitions only.
 * RESERVED / SOLD are owned exclusively by the commerce engine.
 */
const ALLOWED_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  DRAFT: [ItemStatus.PUBLISHED, ItemStatus.AVAILABLE, ItemStatus.ARCHIVED],
  PUBLISHED: [ItemStatus.AVAILABLE, ItemStatus.DRAFT, ItemStatus.ARCHIVED],
  AVAILABLE: [ItemStatus.PUBLISHED, ItemStatus.DRAFT, ItemStatus.ARCHIVED],
  RESERVED: [],
  SOLD: [],
  ARCHIVED: [ItemStatus.DRAFT],
};

export const CATALOG_STATUSES: ItemStatus[] = [
  ItemStatus.DRAFT,
  ItemStatus.PUBLISHED,
  ItemStatus.AVAILABLE,
  ItemStatus.ARCHIVED,
];

export const COMMERCE_STATUSES: ItemStatus[] = [ItemStatus.RESERVED, ItemStatus.SOLD];

export function canTransitionItemStatus(from: ItemStatus, to: ItemStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertItemStatusTransition(from: ItemStatus, to: ItemStatus): void {
  if (!canTransitionItemStatus(from, to)) {
    throw new AppError(
      APP_ERROR_CODES.INVALID_STATUS_TRANSITION,
      `Преминот од ${itemStatusLabels[from]} кон ${itemStatusLabels[to]} не е дозволен.`,
      409,
      { from, to },
    );
  }
}

export function isPubliclyVisibleStatus(status: ItemStatus): boolean {
  return (
    status === ItemStatus.PUBLISHED ||
    status === ItemStatus.AVAILABLE ||
    status === ItemStatus.RESERVED ||
    status === ItemStatus.SOLD
  );
}

export function isPurchasableStatus(status: ItemStatus): boolean {
  return status === ItemStatus.AVAILABLE;
}

export function isCatalogArchivable(status: ItemStatus): boolean {
  return canTransitionItemStatus(status, ItemStatus.ARCHIVED);
}

export function isCommerceLockedStatus(status: ItemStatus): boolean {
  return status === ItemStatus.RESERVED || status === ItemStatus.SOLD;
}

/** Hard delete is only for non-commerce catalog states without commerce history. */
export function canHardDeleteItem(status: ItemStatus, hasCommerceHistory: boolean): boolean {
  if (hasCommerceHistory) return false;
  return status === ItemStatus.DRAFT || status === ItemStatus.ARCHIVED;
}
