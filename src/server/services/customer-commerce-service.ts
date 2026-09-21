import { prisma } from "@/lib/db/prisma";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";

export async function listCustomerOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerOrder(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, reservation: { select: { id: true, status: true } } },
  });
  if (!order) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Нарачката не е пронајдена.", 404);
  }
  if (order.userId !== userId) {
    throw new AppError(APP_ERROR_CODES.FORBIDDEN, "Немате пристап до оваа нарачка.", 403);
  }
  return order;
}

export async function listCustomerReservations(userId: string) {
  return prisma.reservation.findMany({
    where: { userId },
    include: {
      item: { select: { id: true, title: true, referenceNumber: true, slug: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerReservation(userId: string, reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      item: { select: { id: true, title: true, referenceNumber: true, slug: true, status: true } },
    },
  });
  if (!reservation) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Резервацијата не е пронајдена.", 404);
  }
  if (reservation.userId !== userId) {
    throw new AppError(APP_ERROR_CODES.FORBIDDEN, "Немате пристап до оваа резервација.", 403);
  }
  return reservation;
}
