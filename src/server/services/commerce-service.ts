import {
  FulfillmentMethod,
  ItemStatus,
  OrderStatus,
  Prisma,
  ReservationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { formatOrderNumber } from "@/lib/domain/order-number";
import { assertOrderStatusTransition } from "@/lib/domain/order-status";
import {
  assertReservationStatusTransition,
  isReservationExpired,
  RESERVATION_TTL_MS,
} from "@/lib/domain/reservation-status";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";
import { reserveItemSchema } from "@/lib/validation/commerce";

type Tx = Prisma.TransactionClient;

async function allocateOrderNumber(tx: Tx) {
  const counter = await tx.referenceCounter.upsert({
    where: { key: "order" },
    update: { lastNumber: { increment: 1 } },
    create: { key: "order", lastNumber: 1 },
  });
  return formatOrderNumber(counter.lastNumber);
}

async function releaseReservedItemsWithoutActiveReservation(tx: Tx, itemId?: string) {
  await tx.item.updateMany({
    where: {
      status: ItemStatus.RESERVED,
      ...(itemId ? { id: itemId } : {}),
      reservations: { none: { status: ReservationStatus.ACTIVE } },
    },
    data: { status: ItemStatus.AVAILABLE, reservedUntil: null },
  });
}

export async function expireStaleReservations(tx: Tx = prisma, now = new Date()) {
  const stale = await tx.reservation.findMany({
    where: {
      status: ReservationStatus.ACTIVE,
      reservedUntil: { lt: now },
    },
    select: { id: true, itemId: true },
  });
  if (stale.length > 0) {
    const itemIds = [...new Set(stale.map((row) => row.itemId))];
    await tx.reservation.updateMany({
      where: { id: { in: stale.map((row) => row.id) } },
      data: { status: ReservationStatus.EXPIRED, expiredAt: now },
    });
    await tx.item.updateMany({
      where: { id: { in: itemIds }, status: ItemStatus.RESERVED },
      data: { status: ItemStatus.AVAILABLE, reservedUntil: null },
    });
  }
  await releaseReservedItemsWithoutActiveReservation(tx);
  return stale;
}

export async function expireStaleReservationForItem(tx: Tx, itemId: string, now = new Date()) {
  const active = await tx.reservation.findFirst({
    where: { itemId, status: ReservationStatus.ACTIVE },
  });
  if (!active) {
    await releaseReservedItemsWithoutActiveReservation(tx, itemId);
    return null;
  }
  if (!isReservationExpired(active.reservedUntil, now)) return active;

  assertReservationStatusTransition(active.status, ReservationStatus.EXPIRED);
  await tx.reservation.update({
    where: { id: active.id },
    data: { status: ReservationStatus.EXPIRED, expiredAt: now },
  });
  await tx.item.updateMany({
    where: { id: itemId, status: ItemStatus.RESERVED },
    data: { status: ItemStatus.AVAILABLE, reservedUntil: null },
  });
  return null;
}

export async function refreshExpiredReservations() {
  return prisma.$transaction((tx) => expireStaleReservations(tx));
}

export async function reserveItem(
  raw: unknown,
  adminId: string,
  options?: { ttlMs?: number; now?: Date },
) {
  const parsed = reserveItemSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      parsed.error.issues[0]?.message ?? "Податоците не се валидни.",
      400,
    );
  }
  const input = parsed.data;
  const now = options?.now ?? new Date();
  const until = new Date(now.getTime() + (options?.ttlMs ?? RESERVATION_TTL_MS));

  return prisma.$transaction(async (tx) => {
    await expireStaleReservationForItem(tx, input.itemId, now);

    const inquiry = await tx.inquiry.findUnique({ where: { id: input.inquiryId } });
    if (!inquiry || inquiry.itemId !== input.itemId) {
      throw new AppError(APP_ERROR_CODES.VALIDATION, "Барањето не е поврзано со овој предмет.", 400);
    }

    const locked = await tx.item.updateMany({
      where: { id: input.itemId, status: ItemStatus.AVAILABLE },
      data: { status: ItemStatus.RESERVED, reservedUntil: until },
    });
    if (locked.count !== 1) {
      const item = await tx.item.findUnique({ where: { id: input.itemId }, select: { status: true } });
      if (!item) throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Предметот не е пронајден.", 404);
      if (item.status === ItemStatus.SOLD) {
        throw new AppError(APP_ERROR_CODES.CONFLICT, "Предметот е продаден и не може да се резервира.", 409);
      }
      throw new AppError(APP_ERROR_CODES.CONFLICT, "Предметот веќе е резервиран.", 409);
    }

    return tx.reservation.create({
      data: {
        itemId: input.itemId,
        inquiryId: inquiry.id,
        createdByAdminId: adminId,
        userId: inquiry.userId,
        status: ReservationStatus.ACTIVE,
        customerName: inquiry.name,
        customerEmail: inquiry.email,
        customerPhone: inquiry.phone,
        reservedAt: now,
        reservedUntil: until,
        notes: input.notes || null,
        fulfillmentMethod: input.fulfillmentMethod ?? FulfillmentMethod.PICKUP,
      },
    });
  });
}

export async function cancelReservation(reservationId: string, adminId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) {
      throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Резервацијата не е пронајдена.", 404);
    }
    await expireStaleReservationForItem(tx, reservation.itemId, now);
    const current = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!current) {
      throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Резервацијата не е пронајдена.", 404);
    }
    if (current.status !== ReservationStatus.ACTIVE) {
      throw new AppError(APP_ERROR_CODES.INVALID_STATUS_TRANSITION, "Резервацијата не е активна.", 409);
    }

    assertReservationStatusTransition(current.status, ReservationStatus.CANCELLED);
    const released = await tx.item.updateMany({
      where: { id: current.itemId, status: ItemStatus.RESERVED },
      data: { status: ItemStatus.AVAILABLE, reservedUntil: null },
    });
    if (released.count !== 1) {
      throw new AppError(APP_ERROR_CODES.CONFLICT, "Предметот не може да се ослободи.", 409);
    }

    return tx.reservation.update({
      where: { id: current.id },
      data: {
        status: ReservationStatus.CANCELLED,
        cancelledAt: now,
        cancelledByAdminId: adminId,
      },
    });
  });
}

export async function confirmSale(reservationId: string, adminId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: { item: true },
    });
    if (!reservation) {
      throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Резервацијата не е пронајдена.", 404);
    }

    const stillActive = await expireStaleReservationForItem(tx, reservation.itemId, now);
    if (!stillActive || stillActive.id !== reservation.id) {
      throw new AppError(APP_ERROR_CODES.CONFLICT, "Резервацијата е истечена.", 409);
    }

    assertReservationStatusTransition(stillActive.status, ReservationStatus.CONFIRMED);

    const sold = await tx.item.updateMany({
      where: { id: reservation.itemId, status: ItemStatus.RESERVED },
      data: { status: ItemStatus.SOLD, soldAt: reservation.item.soldAt ?? now, reservedUntil: null },
    });
    if (sold.count !== 1) {
      throw new AppError(APP_ERROR_CODES.CONFLICT, "Продажбата не може да се финализира.", 409);
    }

    const confirmed = await tx.reservation.update({
      where: { id: reservation.id },
      data: {
        status: ReservationStatus.CONFIRMED,
        confirmedAt: now,
        confirmedByAdminId: adminId,
      },
    });

    const orderNumber = await allocateOrderNumber(tx);
    const order = await tx.order.create({
      data: {
        orderNumber,
        reservationId: confirmed.id,
        inquiryId: confirmed.inquiryId,
        userId: confirmed.userId,
        createdByAdminId: adminId,
        status: OrderStatus.FULFILLED,
        customerName: confirmed.customerName,
        email: confirmed.customerEmail,
        phone: confirmed.customerPhone,
        notes: confirmed.notes,
        fulfillmentMethod: confirmed.fulfillmentMethod,
        total: reservation.item.price,
        currency: reservation.item.currency,
        items: {
          create: {
            itemId: reservation.item.id,
            title: reservation.item.title,
            reference: reservation.item.referenceNumber,
            price: reservation.item.price,
            currency: reservation.item.currency,
          },
        },
      },
      include: { items: true, reservation: true },
    });

    return { reservation: confirmed, order };
  });
}

export async function changeOrderStatus(orderId: string, status: OrderStatus) {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Нарачката не е пронајдена.", 404);
  }
  if (status === OrderStatus.REVERSED) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      "Поништувањето на продажба се прави преку контролирана акција.",
      400,
    );
  }
  assertOrderStatusTransition(existing.status, status);
  if (existing.status === OrderStatus.FULFILLED) {
    throw new AppError(APP_ERROR_CODES.INVALID_STATUS_TRANSITION, "Завршената продажба не се менува.", 409);
  }
  return prisma.order.update({ where: { id: orderId }, data: { status } });
}

/**
 * Controlled Admin sale reversal.
 * Keeps Order + OrderItem snapshots; marks Order FULFILLED → REVERSED;
 * returns Item SOLD → AVAILABLE. Reservation remains CONFIRMED (historical).
 */
export async function reverseSale(orderId: string, adminId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, reservation: true },
    });
    if (!order) {
      throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Нарачката не е пронајдена.", 404);
    }
    if (order.status !== OrderStatus.FULFILLED) {
      throw new AppError(
        APP_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Само завршена продажба може да се поништи.",
        409,
      );
    }
    if (order.items.length === 0) {
      throw new AppError(APP_ERROR_CODES.VALIDATION, "Нарачката нема предмети.", 400);
    }

    assertOrderStatusTransition(order.status, OrderStatus.REVERSED);

    const itemIds = [...new Set(order.items.map((row) => row.itemId))];
    for (const itemId of itemIds) {
      const released = await tx.item.updateMany({
        where: { id: itemId, status: ItemStatus.SOLD },
        data: { status: ItemStatus.AVAILABLE, reservedUntil: null },
      });
      if (released.count !== 1) {
        throw new AppError(
          APP_ERROR_CODES.CONFLICT,
          "Предметот не е во продаден статус и продажбата не може да се поништи.",
          409,
        );
      }
    }

    const reversed = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.REVERSED,
        reversedAt: now,
        reversedByAdminId: adminId,
      },
      include: { items: true, reservation: true },
    });

    return reversed;
  });
}

export async function getFulfilledOrderForItem(itemId: string) {
  return prisma.order.findFirst({
    where: {
      status: OrderStatus.FULFILLED,
      items: { some: { itemId } },
    },
    include: {
      items: true,
      reversedByAdmin: { select: { id: true, name: true } },
      createdByAdmin: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listReservations(query: { q?: string; status?: ReservationStatus }) {
  await refreshExpiredReservations();
  return prisma.reservation.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { customerName: { contains: query.q, mode: "insensitive" } },
              { customerEmail: { contains: query.q, mode: "insensitive" } },
              { item: { title: { contains: query.q, mode: "insensitive" } } },
              { item: { referenceNumber: { contains: query.q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      item: { select: { id: true, title: true, referenceNumber: true, status: true } },
      createdByAdmin: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReservationById(id: string) {
  await refreshExpiredReservations();
  return prisma.reservation.findUnique({
    where: { id },
    include: {
      item: { select: { id: true, title: true, referenceNumber: true, status: true, reservedUntil: true } },
      inquiry: { select: { id: true, name: true, email: true, message: true } },
      createdByAdmin: { select: { id: true, name: true } },
      cancelledByAdmin: { select: { id: true, name: true } },
      confirmedByAdmin: { select: { id: true, name: true } },
      order: { select: { id: true, orderNumber: true, status: true } },
    },
  });
}

export async function getActiveReservationForItem(itemId: string) {
  const now = new Date();
  await expireStaleReservationForItem(prisma, itemId, now);
  const reservation = await prisma.reservation.findFirst({
    where: { itemId, status: ReservationStatus.ACTIVE },
    include: {
      inquiry: { select: { id: true, name: true, email: true, phone: true } },
      createdByAdmin: { select: { id: true, name: true } },
    },
  });
  if (!reservation) return null;
  return {
    ...reservation,
    remainingHours: Math.max(0, Math.round((reservation.reservedUntil.getTime() - now.getTime()) / 3600000)),
  };
}

export async function listOrders(query: { q?: string; status?: OrderStatus }) {
  return prisma.order.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { orderNumber: { contains: query.q, mode: "insensitive" } },
              { customerName: { contains: query.q, mode: "insensitive" } },
              { email: { contains: query.q, mode: "insensitive" } },
              { items: { some: { reference: { contains: query.q, mode: "insensitive" } } } },
              { items: { some: { title: { contains: query.q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: {
      items: true,
      createdByAdmin: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      reservation: true,
      createdByAdmin: { select: { id: true, name: true } },
    },
  });
}
