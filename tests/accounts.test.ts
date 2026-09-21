import assert from "node:assert/strict";
import { after, test } from "node:test";
import { ItemStatus, UserRole } from "@prisma/client";
import { prisma } from "../src/lib/db/prisma";
import { ensureAdmin } from "../src/lib/auth/admin";
import { verifyPassword } from "../src/lib/auth/password";
import { verifySessionToken, signSessionToken } from "../src/lib/auth/session-token";
import { AppError } from "../src/lib/errors";
import { authenticateUser, registerCustomer } from "../src/server/services/account-service";
import { addFavoriteForUser, mergeAnonymousFavorites } from "../src/server/services/favorite-service";
import { createItemInquiry } from "../src/server/services/inquiry-service";
import { createItem } from "../src/server/services/item-service";
import { confirmSale, reserveItem } from "../src/server/services/commerce-service";
import {
  getCustomerOrder,
  getCustomerReservation,
} from "../src/server/services/customer-commerce-service";

const createdUserIds: string[] = [];
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

async function adminUser() {
  const admin = await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
  assert.ok(admin);
  return admin;
}

async function availableItem(title: string) {
  seq += 1;
  const item = await createItem({
    title,
    slug: `p6-${seq}-${Date.now()}`,
    categoryId: await categoryId(),
    shortDescription: "Краток опис за Фаза 6.",
    description: "Опис.",
    price: "1800",
    currency: "MKD",
    status: ItemStatus.AVAILABLE,
  });
  createdItemIds.push(item.id);
  return item;
}

test("валидна регистрација ја хешира лозинката", async () => {
  seq += 1;
  const email = `p6reg${seq}${Date.now()}@example.com`;
  const user = await registerCustomer({
    name: "Петар Костов",
    email,
    password: "sigurnalozinka",
    confirmPassword: "sigurnalozinka",
  });
  createdUserIds.push(user.id);
  assert.equal(user.role, UserRole.CUSTOMER);
  assert.equal(user.email, email);
  const stored = await prisma.user.findUnique({ where: { id: user.id } });
  assert.ok(stored?.passwordHash);
  assert.notEqual(stored.passwordHash, "sigurnalozinka");
  assert.equal(await verifyPassword("sigurnalozinka", stored.passwordHash), true);
});

test("дупликат е-пошта се одбива", async () => {
  seq += 1;
  const email = `p6dup${seq}${Date.now()}@example.com`;
  const first = await registerCustomer({
    name: "Ана",
    email,
    password: "sigurnalozinka",
    confirmPassword: "sigurnalozinka",
  });
  createdUserIds.push(first.id);
  await assert.rejects(
    () =>
      registerCustomer({
        name: "Ана",
        email,
        password: "sigurnalozinka",
        confirmPassword: "sigurnalozinka",
      }),
    AppError,
  );
});

test("невалидна е-пошта се одбива", async () => {
  await assert.rejects(
    () =>
      registerCustomer({
        name: "Ана",
        email: "not-an-email",
        password: "sigurnalozinka",
        confirmPassword: "sigurnalozinka",
      }),
    AppError,
  );
});

test("слаба лозинка се одбива", async () => {
  await assert.rejects(
    () =>
      registerCustomer({
        name: "Ана",
        email: `weak${Date.now()}@example.com`,
        password: "short",
        confirmPassword: "short",
      }),
    AppError,
  );
});

test("несовпаѓање на лозинки се одбива", async () => {
  await assert.rejects(
    () =>
      registerCustomer({
        name: "Ана",
        email: `mm${Date.now()}@example.com`,
        password: "sigurnalozinka",
        confirmPassword: "drugalozinka1",
      }),
    AppError,
  );
});

test("CUSTOMER најава со точни податоци", async () => {
  seq += 1;
  const email = `p6ok${seq}${Date.now()}@example.com`;
  const user = await registerCustomer({
    name: "Марко",
    email,
    password: "sigurnalozinka",
    confirmPassword: "sigurnalozinka",
  });
  createdUserIds.push(user.id);
  const session = await authenticateUser({ email, password: "sigurnalozinka" });
  assert.equal(session.id, user.id);
  assert.equal(session.role, UserRole.CUSTOMER);
});

test("погрешна лозинка се одбива", async () => {
  seq += 1;
  const email = `p6bad${seq}${Date.now()}@example.com`;
  const user = await registerCustomer({
    name: "Марко",
    email,
    password: "sigurnalozinka",
    confirmPassword: "sigurnalozinka",
  });
  createdUserIds.push(user.id);
  await assert.rejects(() => authenticateUser({ email, password: "pogresnaloz1" }), AppError);
});

test("непостоечка сметка се одбива", async () => {
  await assert.rejects(
    () => authenticateUser({ email: "missing@example.com", password: "sigurnalozinka" }),
    AppError,
  );
});

test("ADMIN и SUPER_ADMIN најава останува валидна", async () => {
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "change-me-now";
  const superAdmin = await prisma.user.findFirst({ where: { role: UserRole.SUPER_ADMIN } });
  assert.ok(superAdmin);
  const superSession = await authenticateUser({
    email: superAdmin.email,
    password,
  });
  assert.equal(superSession.role, UserRole.SUPER_ADMIN);
  const admin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
  if (admin) {
    const session = await authenticateUser({ email: admin.email, password });
    assert.equal(session.role, UserRole.ADMIN);
  }
});

test("CUSTOMER нема admin пристап", async () => {
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
});

test("customer favorite и merge без дупликати", async () => {
  const user = await registerCustomer({
    name: "Фаворит",
    email: `fav${Date.now()}@example.com`,
    password: "sigurnalozinka",
    confirmPassword: "sigurnalozinka",
  });
  createdUserIds.push(user.id);
  const first = await availableItem("Омилен еден");
  const second = await availableItem("Омилен два");
  await addFavoriteForUser(user.id, first.id);
  const merged = await mergeAnonymousFavorites(user.id, [first.id, second.id, "not-a-uuid", first.id]);
  assert.equal(merged.length, 2);
  assert.ok(merged.includes(first.id));
  assert.ok(merged.includes(second.id));
});

test("најавен inquiry се поврзува со сметка, анонимен останува без userId", async () => {
  const user = await registerCustomer({
    name: "Ина",
    email: `inq${Date.now()}@example.com`,
    password: "sigurnalozinka",
    confirmPassword: "sigurnalozinka",
  });
  createdUserIds.push(user.id);
  const item = await availableItem("Inquiry account");
  const linked = await createItemInquiry(
    {
      itemId: item.id,
      name: "Игнорирај",
      email: "other@example.com",
      message: "Ме интересира овој предмет за колекција.",
    },
    `p6inq${Date.now()}`,
    user.id,
  );
  createdInquiryIds.push(linked.id);
  assert.equal(linked.userId, user.id);
  assert.equal(linked.email, user.email);
  const anonItem = await availableItem("Inquiry anon");
  const anon = await createItemInquiry({
    itemId: anonItem.id,
    name: "Анонимен",
    email: `anon${Date.now()}@example.com`,
    message: "Ме интересира овој предмет за колекција.",
  });
  createdInquiryIds.push(anon.id);
  assert.equal(anon.userId, null);
});

test("customer гледа само своја нарачка и резервација", async () => {
  const admin = await adminUser();
  const owner = await registerCustomer({
    name: "Сопственик",
    email: `own${Date.now()}@example.com`,
    password: "sigurnalozinka",
    confirmPassword: "sigurnalozinka",
  });
  const other = await registerCustomer({
    name: "Друг",
    email: `oth${Date.now()}@example.com`,
    password: "sigurnalozinka",
    confirmPassword: "sigurnalozinka",
  });
  createdUserIds.push(owner.id, other.id);
  const item = await availableItem("Сопствена продажба");
  const inquiry = await createItemInquiry(
    {
      itemId: item.id,
      name: owner.name,
      email: owner.email,
      message: "Ме интересира овој предмет за колекција.",
    },
    `p6sale${Date.now()}`,
    owner.id,
  );
  createdInquiryIds.push(inquiry.id);
  const reservation = await reserveItem({ itemId: item.id, inquiryId: inquiry.id }, admin.id);
  createdReservationIds.push(reservation.id);
  assert.equal(reservation.userId, owner.id);
  const mine = await getCustomerReservation(owner.id, reservation.id);
  assert.equal(mine.id, reservation.id);
  await assert.rejects(() => getCustomerReservation(other.id, reservation.id), AppError);
  const sale = await confirmSale(reservation.id, admin.id);
  createdOrderIds.push(sale.order.id);
  assert.equal(sale.order.userId, owner.id);
  const order = await getCustomerOrder(owner.id, sale.order.id);
  assert.equal(order.items[0]?.price.toFixed(2), "1800.00");
  await assert.rejects(() => getCustomerOrder(other.id, sale.order.id), AppError);
});

test("customer не може директно да резервира", async () => {
  const customer = await registerCustomer({
    name: "Неадмин",
    email: `nores${Date.now()}@example.com`,
    password: "sigurnalozinka",
    confirmPassword: "sigurnalozinka",
  });
  createdUserIds.push(customer.id);
  assert.throws(
    () =>
      ensureAdmin({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        role: customer.role,
      }),
    AppError,
  );
});

test("сесиски токен се потпишува и се проверува", async () => {
  const token = await signSessionToken({
    id: "u1",
    email: "u@example.com",
    name: "У",
    role: "CUSTOMER",
  });
  const session = await verifySessionToken(token);
  assert.equal(session?.id, "u1");
  assert.equal(await verifySessionToken("bad.token"), null);
});

test("лозинката не се враќа од public account", async () => {
  const user = await registerCustomer({
    name: "Без хеш",
    email: `nh${Date.now()}@example.com`,
    password: "sigurnalozinka",
    confirmPassword: "sigurnalozinka",
  });
  createdUserIds.push(user.id);
  assert.equal("passwordHash" in user, false);
});

after(async () => {
  if (createdOrderIds.length) await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
  if (createdReservationIds.length) {
    await prisma.reservation.deleteMany({ where: { id: { in: createdReservationIds } } });
  }
  if (createdInquiryIds.length) await prisma.inquiry.deleteMany({ where: { id: { in: createdInquiryIds } } });
  if (createdItemIds.length) {
    await prisma.favorite.deleteMany({ where: { itemId: { in: createdItemIds } } });
    await prisma.item.deleteMany({ where: { id: { in: createdItemIds } } });
  }
  if (createdUserIds.length) {
    await prisma.favorite.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});
