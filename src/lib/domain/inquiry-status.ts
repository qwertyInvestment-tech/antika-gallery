import { InquiryStatus } from "@prisma/client";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";

const ALLOWED: Record<InquiryStatus, InquiryStatus[]> = {
  NEW: [InquiryStatus.CONTACTED],
  IN_REVIEW: [InquiryStatus.CONTACTED, InquiryStatus.CLOSED],
  CONTACTED: [InquiryStatus.CLOSED],
  REPLIED: [InquiryStatus.CLOSED],
  CLOSED: [],
};

export const inquiryAdminStatuses = [InquiryStatus.NEW, InquiryStatus.CONTACTED, InquiryStatus.CLOSED] as const;

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  NEW: "Ново",
  IN_REVIEW: "Во преглед",
  CONTACTED: "Контактирано",
  REPLIED: "Одговорено",
  CLOSED: "Затворено",
};

export function nextInquiryStatuses(from: InquiryStatus): InquiryStatus[] {
  return ALLOWED[from] ?? [];
}

export function canTransitionInquiryStatus(from: InquiryStatus, to: InquiryStatus) {
  if (from === to) return true;
  return nextInquiryStatuses(from).includes(to);
}

export function assertInquiryStatusTransition(from: InquiryStatus, to: InquiryStatus) {
  if (!canTransitionInquiryStatus(from, to)) {
    throw new AppError(
      APP_ERROR_CODES.INVALID_STATUS_TRANSITION,
      `Преминот од ${inquiryStatusLabels[from]} кон ${inquiryStatusLabels[to]} не е дозволен.`,
      409,
      { from, to },
    );
  }
}
