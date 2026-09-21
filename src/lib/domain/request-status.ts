import { ItemRequestStatus } from "@prisma/client";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";

const ALLOWED: Record<ItemRequestStatus, ItemRequestStatus[]> = {
  NEW: [ItemRequestStatus.CONTACTED],
  IN_REVIEW: [ItemRequestStatus.CONTACTED, ItemRequestStatus.CLOSED],
  CONTACTED: [ItemRequestStatus.CLOSED],
  MATCHED: [ItemRequestStatus.CLOSED],
  CLOSED: [],
};

export const requestAdminStatuses = [ItemRequestStatus.NEW, ItemRequestStatus.CONTACTED, ItemRequestStatus.CLOSED] as const;

export const requestStatusLabels: Record<ItemRequestStatus, string> = {
  NEW: "Ново",
  IN_REVIEW: "Во преглед",
  CONTACTED: "Контактирано",
  MATCHED: "Пронајдено",
  CLOSED: "Затворено",
};

export function nextRequestStatuses(from: ItemRequestStatus): ItemRequestStatus[] {
  return ALLOWED[from] ?? [];
}

export function canTransitionRequestStatus(from: ItemRequestStatus, to: ItemRequestStatus) {
  if (from === to) return true;
  return nextRequestStatuses(from).includes(to);
}

export function assertRequestStatusTransition(from: ItemRequestStatus, to: ItemRequestStatus) {
  if (!canTransitionRequestStatus(from, to)) {
    throw new AppError(
      APP_ERROR_CODES.INVALID_STATUS_TRANSITION,
      `Преминот од ${requestStatusLabels[from]} кон ${requestStatusLabels[to]} не е дозволен.`,
      409,
      { from, to },
    );
  }
}
