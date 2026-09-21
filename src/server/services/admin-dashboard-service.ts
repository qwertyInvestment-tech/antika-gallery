import { InquiryStatus, ItemRequestStatus, ItemStatus, ReservationStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { refreshExpiredReservations } from "@/server/services/commerce-service";

const QUEUE_LIMIT = 8;
const EXPIRING_WITHIN_MS = 12 * 60 * 60 * 1000;

export async function getAdminDashboard() {
  await refreshExpiredReservations();
  const now = new Date();
  const expiringUntil = new Date(now.getTime() + EXPIRING_WITHIN_MS);

  const [statusGroups, newInquiryCount, activeReservationCount, newInquiries, newRequests, activeReservations, expiringReservations] =
    await Promise.all([
      prisma.item.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.inquiry.count({ where: { status: InquiryStatus.NEW } }),
      prisma.reservation.count({ where: { status: ReservationStatus.ACTIVE } }),
      prisma.inquiry.findMany({
        where: { status: InquiryStatus.NEW },
        orderBy: { createdAt: "desc" },
        take: QUEUE_LIMIT,
        select: {
          id: true,
          name: true,
          createdAt: true,
          item: { select: { referenceNumber: true, title: true } },
        },
      }),
      prisma.itemRequest.findMany({
        where: { status: ItemRequestStatus.NEW },
        orderBy: { createdAt: "desc" },
        take: QUEUE_LIMIT,
        select: { id: true, name: true, description: true, createdAt: true },
      }),
      prisma.reservation.findMany({
        where: { status: ReservationStatus.ACTIVE },
        orderBy: { reservedUntil: "asc" },
        take: QUEUE_LIMIT,
        select: {
          id: true,
          customerName: true,
          reservedUntil: true,
          item: { select: { referenceNumber: true, title: true } },
        },
      }),
      prisma.reservation.findMany({
        where: {
          status: ReservationStatus.ACTIVE,
          reservedUntil: { gt: now, lte: expiringUntil },
        },
        orderBy: { reservedUntil: "asc" },
        take: QUEUE_LIMIT,
        select: {
          id: true,
          customerName: true,
          reservedUntil: true,
          item: { select: { referenceNumber: true, title: true } },
        },
      }),
    ]);

  const byStatus = Object.fromEntries(statusGroups.map((row) => [row.status, row._count._all])) as Partial<
    Record<ItemStatus, number>
  >;
  const itemTotal = statusGroups.reduce((sum, row) => sum + row._count._all, 0);

  return {
    counts: {
      items: itemTotal,
      available: byStatus[ItemStatus.AVAILABLE] ?? 0,
      reserved: byStatus[ItemStatus.RESERVED] ?? 0,
      sold: byStatus[ItemStatus.SOLD] ?? 0,
      newInquiries: newInquiryCount,
      activeReservations: activeReservationCount,
    },
    newInquiries,
    newRequests,
    activeReservations,
    expiringReservations,
  };
}
