import assert from "node:assert/strict";
import { after, test } from "node:test";
import { ItemStatus, OrderStatus, ReservationStatus } from "@prisma/client";
import { prisma } from "../src/lib/db/prisma";
import { ensureAdmin } from "../src/lib/auth/admin";
import { AppError } from "../src/lib/errors";
import { assertOrderStatusTransition } from "../src/lib/domain/order-status";
import { assertReservationStatusTransition } from "../src/lib/domain/reservation-status";
import { createItemInquiry } from "../src/server/services/inquiry-service";
import { createItem, changeItemStatus } from "../src/server/services/item-service";
import {
  cancelReservation,
  changeOrderStatus,
  confirmSale,
  refreshExpiredReservations,
  reserveItem,
  reverseSale,
} from "../src/server/services/commerce-service";
import { canTransitionItemStatus } from "../src/lib/domain/item-status";

const createdItemIds: string[] = [];
const createdInquiryIds: string[] = [];
const createdReservationIds: string[] = [];
const createdOrderIds: string[] = [];
let seq = 0;

async function categoryId() {
  const category = await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } });
  assert.ok(category);
  return category.id;
}

async function adminId() {
  const admin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
  });
  assert.ok(admin);
  return admin.id;
}

async function availableItem(title: string) {
  seq += 1;
  const item = await createItem({
    title,
    slug: `p5-${seq}-${Date.now()}`,
    categoryId: await categoryId(),
    shortDescription: "Краток опис за Фаза 5.",
    description: "Опис.",
    price: "2500",
    currency: "MKD",
    status: ItemStatus.AVAILABLE,
  });
  createdItemIds.push(item.id);
  return item;
}

async function inquiryFor(itemId: string) {
  seq += 1;
  const inquiry = await createItemInquiry({
    itemId,
    name: "Тест Купувач",
    email: `p5${seq}${Date.now()}@example.com`,
    phone: "070111222",
    message: "Ме интересира овој предмет за колекција.",
  });
  createdInquiryIds.push(inquiry.id);
  return inquiry;
}

test("AVAILABLE → RESERVED преку admin", async () => {
  const item = await availableItem("Резервација валидна");
  const inquiry = await inquiryFor(item.id);
  const reservation = await reserveItem({ itemId: item.id, inquiryId: inquiry.id }, await adminId());
  createdReservationIds.push(reservation.id);
  const stored = await prisma.item.findUnique({ where: { id: item.id } });
  assert.equal(stored?.status, ItemStatus.RESERVED);
  assert.equal(reservation.status, ReservationStatus.ACTIVE);
  assert.ok(reservation.reservedUntil.getTime() > Date.now());
});

test("RESERVED не може повторно да се резервира", async () => {
  const item = await availableItem("Двојна резервација");
  const first = await inquiryFor(item.id);
  const second = await inquiryFor(item.id);
  const admin = await adminId();
  const reservation = await reserveItem({ itemId: item.id, inquiryId: first.id }, admin);
  createdReservationIds.push(reservation.id);
  await assert.rejects(() => reserveItem({ itemId: item.id, inquiryId: second.id }, admin), AppError);
});

test("SOLD не може да се резервира", async () => {
  const item = await availableItem("Продаден резерва");
  const inquiry = await inquiryFor(item.id);
  await prisma.item.update({ where: { id: item.id }, data: { status: ItemStatus.SOLD } });
  const admin = await adminId();
  await assert.rejects(() => reserveItem({ itemId: item.id, inquiryId: inquiry.id }, admin), AppError);
});

test("RESERVED без активна резервација се ослободува при читање", async () => {
  const item = await availableItem("Осиротена резерва");
  await prisma.item.update({ where: { id: item.id }, data: { status: ItemStatus.RESERVED } });
  await refreshExpiredReservations();
  const stored = await prisma.item.findUnique({ where: { id: item.id } });
  assert.equal(stored?.status, ItemStatus.AVAILABLE);
});

test("истечена резервација го враќа предметот во AVAILABLE", async () => {
  const item = await availableItem("Истек резерва");
  const inquiry = await inquiryFor(item.id);
  const reservation = await reserveItem(
    { itemId: item.id, inquiryId: inquiry.id },
    await adminId(),
    { ttlMs: -1000 },
  );
  createdReservationIds.push(reservation.id);
  await refreshExpiredReservations();
  const stored = await prisma.item.findUnique({ where: { id: item.id } });
  const row = await prisma.reservation.findUnique({ where: { id: reservation.id } });
  assert.equal(stored?.status, ItemStatus.AVAILABLE);
  assert.equal(row?.status, ReservationStatus.EXPIRED);
});

test("откажување ја враќа AVAILABLE", async () => {
  const item = await availableItem("Откажи резерва");
  const inquiry = await inquiryFor(item.id);
  const reservation = await reserveItem({ itemId: item.id, inquiryId: inquiry.id }, await adminId());
  createdReservationIds.push(reservation.id);
  await cancelReservation(reservation.id, await adminId());
  const stored = await prisma.item.findUnique({ where: { id: item.id } });
  assert.equal(stored?.status, ItemStatus.AVAILABLE);
});

test("потврда создава Order со snapshot и SOLD", async () => {
  const item = await availableItem("Потврда продажба");
  const inquiry = await inquiryFor(item.id);
  const reservation = await reserveItem({ itemId: item.id, inquiryId: inquiry.id }, await adminId());
  createdReservationIds.push(reservation.id);
  const result = await confirmSale(reservation.id, await adminId());
  createdOrderIds.push(result.order.id);
  assert.equal(result.order.status, OrderStatus.FULFILLED);
  assert.equal(result.order.items[0]?.reference, item.referenceNumber);
  assert.equal(result.order.items[0]?.title, item.title);
  assert.equal(result.order.items[0]?.price.toFixed(2), "2500.00");
  const stored = await prisma.item.findUnique({ where: { id: item.id } });
  assert.equal(stored?.status, ItemStatus.SOLD);
  await prisma.item.update({ where: { id: item.id }, data: { price: "9999" } });
  const order = await prisma.order.findUnique({
    where: { id: result.order.id },
    include: { items: true },
  });
  assert.equal(order?.items[0]?.price.toFixed(2), "2500.00");
});

test("дупликат продажба е блокирана", async () => {
  const item = await availableItem("Дупликат продажба");
  const inquiry = await inquiryFor(item.id);
  const reservation = await reserveItem({ itemId: item.id, inquiryId: inquiry.id }, await adminId());
  createdReservationIds.push(reservation.id);
  const first = await confirmSale(reservation.id, await adminId());
  createdOrderIds.push(first.order.id);
  const admin = await adminId();
  await assert.rejects(() => confirmSale(reservation.id, admin), AppError);
});

test("SOLD останува терминален преку catalog status", async () => {
  const item = await availableItem("Терминален sold");
  await prisma.item.update({ where: { id: item.id }, data: { status: ItemStatus.SOLD } });
  await assert.rejects(() => changeItemStatus(item.id, ItemStatus.AVAILABLE), AppError);
});

test("catalog не дозволува AVAILABLE → RESERVED / SOLD", () => {
  assert.equal(canTransitionItemStatus(ItemStatus.AVAILABLE, ItemStatus.RESERVED), false);
  assert.equal(canTransitionItemStatus(ItemStatus.AVAILABLE, ItemStatus.SOLD), false);
});

test("RESERVED не може да се архивира преку catalog", async () => {
  const item = await availableItem("Резерва архива блок");
  const inquiry = await inquiryFor(item.id);
  const reservation = await reserveItem({ itemId: item.id, inquiryId: inquiry.id }, await adminId());
  createdReservationIds.push(reservation.id);
  await assert.rejects(() => changeItemStatus(item.id, ItemStatus.ARCHIVED), AppError);
});

test("SOLD reversal: FULFILLED → REVERSED, Item → AVAILABLE, snapshot останува", async () => {
  const item = await availableItem("Reversal QA");
  const inquiry = await inquiryFor(item.id);
  const reservation = await reserveItem({ itemId: item.id, inquiryId: inquiry.id }, await adminId());
  createdReservationIds.push(reservation.id);
  const sale = await confirmSale(reservation.id, await adminId());
  createdOrderIds.push(sale.order.id);
  const snapshotTitle = sale.order.items[0]?.title;
  const snapshotPrice = sale.order.items[0]?.price.toFixed(2);

  const reversed = await reverseSale(sale.order.id, await adminId());
  assert.equal(reversed.status, OrderStatus.REVERSED);
  assert.ok(reversed.reversedAt);
  assert.equal(reversed.reversedByAdminId, await adminId());

  const storedItem = await prisma.item.findUnique({ where: { id: item.id } });
  assert.equal(storedItem?.status, ItemStatus.AVAILABLE);

  const order = await prisma.order.findUnique({
    where: { id: sale.order.id },
    include: { items: true },
  });
  assert.equal(order?.status, OrderStatus.REVERSED);
  assert.equal(order?.items[0]?.title, snapshotTitle);
  assert.equal(order?.items[0]?.price.toFixed(2), snapshotPrice);
  assert.equal(order?.items.length, 1);

  const reservationRow = await prisma.reservation.findUnique({ where: { id: reservation.id } });
  assert.equal(reservationRow?.status, ReservationStatus.CONFIRMED);
});

test("двојно reversal е блокирано", async () => {
  const item = await availableItem("Double reversal");
  const inquiry = await inquiryFor(item.id);
  const admin = await adminId();
  const reservation = await reserveItem({ itemId: item.id, inquiryId: inquiry.id }, admin);
  createdReservationIds.push(reservation.id);
  const sale = await confirmSale(reservation.id, admin);
  createdOrderIds.push(sale.order.id);
  await reverseSale(sale.order.id, admin);
  await assert.rejects(() => reverseSale(sale.order.id, admin), AppError);
});

test("невалиден премин EXPIRED → ACTIVE", () => {
  assert.throws(
    () => assertReservationStatusTransition(ReservationStatus.EXPIRED, ReservationStatus.ACTIVE),
    AppError,
  );
});

test("невалиден премин FULFILLED → CANCELLED", () => {
  assert.throws(() => assertOrderStatusTransition(OrderStatus.FULFILLED, OrderStatus.CANCELLED), AppError);
});

test("откажување на PENDING нарачка", async () => {
  const order = await prisma.order.create({
    data: {
      orderNumber: `ORD-T${Date.now()}`,
      customerName: "Тест",
      email: "order.cancel@example.com",
      total: "100",
      currency: "MKD",
      status: OrderStatus.PENDING,
    },
  });
  createdOrderIds.push(order.id);
  const updated = await changeOrderStatus(order.id, OrderStatus.CANCELLED);
  assert.equal(updated.status, OrderStatus.CANCELLED);
});

test("истовремени резервации: само една успева", async () => {
  const item = await availableItem("Конкуренција");
  const first = await inquiryFor(item.id);
  const second = await inquiryFor(item.id);
  const admin = await adminId();
  const results = await Promise.allSettled([
    reserveItem({ itemId: item.id, inquiryId: first.id }, admin),
    reserveItem({ itemId: item.id, inquiryId: second.id }, admin),
  ]);
  const fulfilled = results.filter((row) => row.status === "fulfilled");
  const rejected = results.filter((row) => row.status === "rejected");
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  if (fulfilled[0]?.status === "fulfilled") createdReservationIds.push(fulfilled[0].value.id);
  const stored = await prisma.item.findUnique({ where: { id: item.id } });
  assert.equal(stored?.status, ItemStatus.RESERVED);
  const active = await prisma.reservation.count({
    where: { itemId: item.id, status: ReservationStatus.ACTIVE },
  });
  assert.equal(active, 1);
});

test("по истек нова резервација успева", async () => {
  const item = await availableItem("По истек");
  const first = await inquiryFor(item.id);
  const second = await inquiryFor(item.id);
  const expired = await reserveItem(
    { itemId: item.id, inquiryId: first.id },
    await adminId(),
    { ttlMs: -5 },
  );
  createdReservationIds.push(expired.id);
  const next = await reserveItem({ itemId: item.id, inquiryId: second.id }, await adminId());
  createdReservationIds.push(next.id);
  assert.equal(next.status, ReservationStatus.ACTIVE);
});

test("public/customer не може admin commerce", () => {
  assert.throws(
    () =>
      ensureAdmin({
        id: "c1",
        email: "c@example.com",
        name: "Корисник",
        role: "CUSTOMER",
      }),
    AppError,
  );
  assert.throws(() => ensureAdmin(null), AppError);
});

test("inquiry не го менува статусот на предметот", async () => {
  const item = await availableItem("Inquiry без reserve");
  await inquiryFor(item.id);
  const stored = await prisma.item.findUnique({ where: { id: item.id } });
  assert.equal(stored?.status, ItemStatus.AVAILABLE);
});

after(async () => {
  if (createdOrderIds.length) await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
  if (createdReservationIds.length) {
    await prisma.reservation.deleteMany({ where: { id: { in: createdReservationIds } } });
  }
  if (createdInquiryIds.length) await prisma.inquiry.deleteMany({ where: { id: { in: createdInquiryIds } } });
  if (createdItemIds.length) await prisma.item.deleteMany({ where: { id: { in: createdItemIds } } });
  await prisma.$disconnect();
});
