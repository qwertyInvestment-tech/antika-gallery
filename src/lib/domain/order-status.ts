import { OrderStatus } from "@prisma/client";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.FULFILLED, OrderStatus.CANCELLED],
  PAID: [OrderStatus.FULFILLED, OrderStatus.CANCELLED],
  FULFILLED: [OrderStatus.REVERSED],
  REVERSED: [],
  CANCELLED: [],
};

export const orderAdminStatuses = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.FULFILLED,
  OrderStatus.REVERSED,
  OrderStatus.CANCELLED,
] as const;

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Започната",
  CONFIRMED: "Потврдена",
  PAID: "Платена",
  FULFILLED: "Завршена",
  REVERSED: "Поништена продажба",
  CANCELLED: "Откажана",
};

export function nextOrderStatuses(from: OrderStatus) {
  return ALLOWED[from] ?? [];
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus) {
  if (from === to) return true;
  return nextOrderStatuses(from).includes(to);
}

export function assertOrderStatusTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransitionOrderStatus(from, to)) {
    throw new AppError(
      APP_ERROR_CODES.INVALID_STATUS_TRANSITION,
      `Преминот од ${orderStatusLabels[from]} кон ${orderStatusLabels[to]} не е дозволен.`,
      409,
      { from, to },
    );
  }
}
