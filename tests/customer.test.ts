import assert from "node:assert/strict";
import { after, test } from "node:test";
import { InquiryStatus, ItemRequestStatus, ItemStatus } from "@prisma/client";
import { prisma } from "../src/lib/db/prisma";
import { ensureAdmin } from "../src/lib/auth/admin";
import { addFavorite, hasFavorite, readFavorites, removeFavorite, writeFavorites } from "../src/lib/favorites/store";
import { getPublicItemsByIds } from "../src/server/catalog/queries";
import { changeInquiryStatus, createItemInquiry } from "../src/server/services/inquiry-service";
import { nextInquiryStatuses } from "../src/lib/domain/inquiry-status";
import { nextRequestStatuses } from "../src/lib/domain/request-status";
import { changeWantedRequestStatus, createWantedRequest } from "../src/server/services/request-service";
import { reserveItem } from "../src/server/services/commerce-service";
import { changeItemStatus, createItem } from "../src/server/services/item-service";
import { AppError } from "../src/lib/errors";

const createdItemIds: string[] = [];
const createdInquiryIds: string[] = [];
const createdRequestIds: string[] = [];
let seq = 0;

function memoryStorage(initial = "") {
  let value = initial;
  return {
    getItem: () => value || null,
    setItem: (_key: string, next: string) => {
      value = next;
    },
  };
}

async function categoryId() {
  const category = await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } });
  assert.ok(category);
  return category.id;
}

async function availableItem(title: string) {
  seq += 1;
  const item = await createItem({
    title,
    slug: `p4-${seq}-${Date.now()}`,
    categoryId: await categoryId(),
    shortDescription: "Краток опис за Фаза 4.",
    description: "Опис.",
    price: "1200",
    currency: "MKD",
    status: ItemStatus.AVAILABLE,
  });
  createdItemIds.push(item.id);
  return item;
}

test("додавање омилен предмет", () => {
  const storage = memoryStorage();
  const next = addFavorite([], { id: "a", slug: "s", reference: "ANT-000001" });
  writeFavorites(storage, next);
  assert.equal(readFavorites(storage).length, 1);
});

test("отстранување омилен предмет", () => {
  const items = addFavorite([], { id: "a", slug: "s", reference: "ANT-000001" });
  assert.equal(removeFavorite(items, "a").length, 0);
});

test("дупликат омилен предмет не се додава повторно", () => {
  const first = addFavorite([], { id: "a", slug: "s", reference: "ANT-000001" });
  const second = addFavorite(first, { id: "a", slug: "s", reference: "ANT-000001" });
  assert.equal(second.length, 1);
  assert.equal(hasFavorite(second, "a"), true);
});

test("празни омилени", async () => {
  const items = await getPublicItemsByIds([]);
  assert.equal(items.length, 0);
});

test("SOLD омилен предмет останува видлив", async () => {
  const item = await availableItem("Омилен продаден");
  await prisma.item.update({ where: { id: item.id }, data: { status: ItemStatus.SOLD } });
  const found = await getPublicItemsByIds([item.id]);
  assert.equal(found[0]?.status, ItemStatus.SOLD);
});

test("RESERVED омилен предмет е означен како резервиран", async () => {
  const item = await availableItem("Омилен резервиран");
  const inquiry = await createItemInquiry({
    itemId: item.id,
    name: "Тест Купувач",
    email: `favres${Date.now()}@example.com`,
    message: "Ме интересира овој предмет за колекција.",
  });
  createdInquiryIds.push(inquiry.id);
  const admin = await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
  assert.ok(admin);
  await reserveItem({ itemId: item.id, inquiryId: inquiry.id }, admin.id);
  const found = await getPublicItemsByIds([item.id]);
  assert.equal(found[0]?.status, ItemStatus.RESERVED);
});

test("валидно inquiry", async () => {
  const item = await availableItem("Inquiry валиден");
  const inquiry = await createItemInquiry({
    itemId: item.id,
    name: "Ана Петрова",
    email: `ana${seq}@example.com`,
    phone: "070123456",
    message: "Ме интересира овој предмет за колекција.",
  });
  createdInquiryIds.push(inquiry.id);
  assert.equal(inquiry.itemId, item.id);
  assert.equal(inquiry.status, InquiryStatus.NEW);
});

test("невалидна е-пошта се одбива", async () => {
  const item = await availableItem("Inquiry email");
  await assert.rejects(
    () =>
      createItemInquiry({
        itemId: item.id,
        name: "Ана",
        email: "nevalidno",
        message: "Ме интересира овој предмет за колекција.",
      }),
    AppError,
  );
});

test("поракa е задолжителна", async () => {
  const item = await availableItem("Inquiry порака");
  await assert.rejects(
    () =>
      createItemInquiry({
        itemId: item.id,
        name: "Ана Петрова",
        email: `msg${seq}@example.com`,
        message: "",
      }),
    AppError,
  );
});

test("непостоечки предмет се одбива", async () => {
  await assert.rejects(
    () =>
      createItemInquiry({
        itemId: "00000000-0000-0000-0000-000000000099",
        name: "Ана Петрова",
        email: `none${seq}@example.com`,
        message: "Ме интересира овој предмет за колекција.",
      }),
    AppError,
  );
});

test("архивиран предмет се одбива", async () => {
  const item = await availableItem("Inquiry архива");
  await changeItemStatus(item.id, ItemStatus.ARCHIVED);
  await assert.rejects(
    () =>
      createItemInquiry({
        itemId: item.id,
        name: "Ана Петрова",
        email: `arch${seq}@example.com`,
        message: "Ме интересира овој предмет за колекција.",
      }),
    AppError,
  );
});

test("продаден предмет не прима inquiry", async () => {
  const item = await availableItem("Inquiry sold");
  await prisma.item.update({ where: { id: item.id }, data: { status: ItemStatus.SOLD } });
  await assert.rejects(
    () =>
      createItemInquiry({
        itemId: item.id,
        name: "Ана Петрова",
        email: `sold${seq}@example.com`,
        message: "Ме интересира овој предмет за колекција.",
      }),
    AppError,
  );
});

test("валиден премин NEW → CONTACTED", async () => {
  const item = await availableItem("Inquiry статус");
  const inquiry = await createItemInquiry({
    itemId: item.id,
    name: "Ана Петрова",
    email: `st${seq}@example.com`,
    message: "Ме интересира овој предмет за колекција.",
  });
  createdInquiryIds.push(inquiry.id);
  const updated = await changeInquiryStatus(inquiry.id, InquiryStatus.CONTACTED);
  assert.equal(updated.status, InquiryStatus.CONTACTED);
});

test("UI следна транзиција: NEW нема CLOSED, CONTACTED има CLOSED, CLOSED нема акции", () => {
  assert.deepEqual(nextInquiryStatuses(InquiryStatus.NEW), [InquiryStatus.CONTACTED]);
  assert.deepEqual(nextInquiryStatuses(InquiryStatus.CONTACTED), [InquiryStatus.CLOSED]);
  assert.deepEqual(nextInquiryStatuses(InquiryStatus.CLOSED), []);
  assert.deepEqual(nextRequestStatuses(ItemRequestStatus.NEW), [ItemRequestStatus.CONTACTED]);
  assert.deepEqual(nextRequestStatuses(ItemRequestStatus.CONTACTED), [ItemRequestStatus.CLOSED]);
  assert.deepEqual(nextRequestStatuses(ItemRequestStatus.CLOSED), []);
});

test("невалиден премин NEW → CLOSED", async () => {
  const item = await availableItem("Inquiry лош премин");
  const inquiry = await createItemInquiry({
    itemId: item.id,
    name: "Ана Петрова",
    email: `bad${seq}@example.com`,
    message: "Ме интересира овој предмет за колекција.",
  });
  createdInquiryIds.push(inquiry.id);
  await assert.rejects(() => changeInquiryStatus(inquiry.id, InquiryStatus.CLOSED), AppError);
});

test("CUSTOMER нема admin пристап", () => {
  assert.throws(
    () =>
      ensureAdmin({
        id: "u1",
        email: "c@example.com",
        name: "Корисник",
        role: "CUSTOMER",
      }),
    AppError,
  );
  assert.throws(() => ensureAdmin(null), AppError);
});

test("валидно барање за предмет", async () => {
  const request = await createWantedRequest({
    name: "Марко Николов",
    email: `wanted${Date.now()}@example.com`,
    phone: "071222333",
    description: "Барам стар македонски фотоапарат од 1950–1970.",
    details: "По можност со куќиште.",
  });
  createdRequestIds.push(request.id);
  assert.equal(request.status, ItemRequestStatus.NEW);
});

test("невалидна е-пошта кај барање", async () => {
  await assert.rejects(
    () =>
      createWantedRequest({
        name: "Марко",
        email: "лошо",
        description: "Барам стар македонски фотоапарат од 1950–1970.",
      }),
    AppError,
  );
});

test("описот е задолжителен", async () => {
  await assert.rejects(
    () =>
      createWantedRequest({
        name: "Марко Николов",
        email: `need${Date.now()}@example.com`,
        description: "",
      }),
    AppError,
  );
});

test("валиден премин на барање NEW → CONTACTED", async () => {
  const request = await createWantedRequest({
    name: "Марко Николов",
    email: `reqst${Date.now()}@example.com`,
    description: "Барам керамички сад со патина, без измислена историја.",
  });
  createdRequestIds.push(request.id);
  const updated = await changeWantedRequestStatus(request.id, ItemRequestStatus.CONTACTED);
  assert.equal(updated.status, ItemRequestStatus.CONTACTED);
});

test("неавторизиран пристап до admin барања", () => {
  assert.throws(
    () =>
      ensureAdmin({
        id: "u2",
        email: "guest@example.com",
        name: "Гостин",
        role: "CUSTOMER",
      }),
    AppError,
  );
});

after(async () => {
  if (createdItemIds.length) {
    await prisma.order.deleteMany({ where: { items: { some: { itemId: { in: createdItemIds } } } } });
    await prisma.reservation.deleteMany({ where: { itemId: { in: createdItemIds } } });
  }
  if (createdInquiryIds.length) await prisma.inquiry.deleteMany({ where: { id: { in: createdInquiryIds } } });
  if (createdRequestIds.length) await prisma.itemRequest.deleteMany({ where: { id: { in: createdRequestIds } } });
  if (createdItemIds.length) await prisma.item.deleteMany({ where: { id: { in: createdItemIds } } });
  await prisma.$disconnect();
});
