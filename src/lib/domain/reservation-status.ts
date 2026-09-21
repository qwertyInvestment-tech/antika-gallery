import { ReservationStatus } from "@prisma/client";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";

const ALLOWED: Record<ReservationStatus, ReservationStatus[]> = {
  ACTIVE: [ReservationStatus.CONFIRMED, ReservationStatus.EXPIRED, ReservationStatus.CANCELLED],
  CONFIRMED: [],
  EXPIRED: [],
  CANCELLED: [],
};

export const RESERVATION_TTL_MS = 48 * 60 * 60 * 1000;

export const reservationAdminStatuses = [
  ReservationStatus.ACTIVE,
  ReservationStatus.CONFIRMED,
  ReservationStatus.EXPIRED,
  ReservationStatus.CANCELLED,
] as const;

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  ACTIVE: "Активна",
  CONFIRMED: "Потврдена",
  EXPIRED: "Истечена",
  CANCELLED: "Откажана",
};

export function nextReservationStatuses(from: ReservationStatus) {
  return ALLOWED[from] ?? [];
}

export function canTransitionReservationStatus(from: ReservationStatus, to: ReservationStatus) {
  if (from === to) return true;
  return nextReservationStatuses(from).includes(to);
}

export function assertReservationStatusTransition(from: ReservationStatus, to: ReservationStatus) {
  if (!canTransitionReservationStatus(from, to)) {
    throw new AppError(
      APP_ERROR_CODES.INVALID_STATUS_TRANSITION,
      `Преминот од ${reservationStatusLabels[from]} кон ${reservationStatusLabels[to]} не е дозволен.`,
      409,
      { from, to },
    );
  }
}

export function isReservationExpired(reservedUntil: Date, now = new Date()) {
  return reservedUntil.getTime() < now.getTime();
}

export function formatReservationRemaining(reservedUntil: Date, now = new Date()) {
  if (isReservationExpired(reservedUntil, now)) {
    return "Истечена";
  }

  const ms = reservedUntil.getTime() - now.getTime();
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const sameCalendarDay =
    reservedUntil.getFullYear() === now.getFullYear() &&
    reservedUntil.getMonth() === now.getMonth() &&
    reservedUntil.getDate() === now.getDate();

  if (sameCalendarDay) {
    const time = reservedUntil.toLocaleTimeString("mk-MK", { hour: "2-digit", minute: "2-digit" });
    return `Истекува денес во ${time}`;
  }

  return `Истекува за ${hours}ч ${minutes}мин`;
}
