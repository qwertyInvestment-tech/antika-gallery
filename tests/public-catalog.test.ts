import assert from "node:assert/strict";
import { after, test } from "node:test";
import { ItemStatus } from "@prisma/client";
import { prisma } from "../src/lib/db/prisma";
import { isPurchasableStatus } from "../src/lib/domain/item-status";
import {
  getItemBySlug,
  getPublicCategoryBySlug,
  getPublishedItems,
  searchPublicCatalog,
} from "../src/server/catalog/queries";
import { createItemInquiry } from "../src/server/services/inquiry-service";
import { reserveItem } from "../src/server/services/commerce-service";
import { changeItemStatus, createItem } from "../src/server/services/item-service";

const createdIds: string[] = [];

function payload(overrides: Record<string, unknown> = {}) {
  return {
    title: "Јавен тест",
    slug: "",
    categoryId: "",
    shortDescription: "Краток опис за јавен тест.",
    description: "Опис.",
    price: "1000",
    currency: "MKD",
    status: ItemStatus.AVAILABLE,
    ...overrides,
  };
}

async function firstCategory() {
  const category = await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } });
  assert.ok(category);
  return category;
}

function filters(overrides: Record<string, unknown> = {}) {
  return {
    sort: "newest" as const,
    page: 1,
    pageSize: 8,
    ...overrides,
  };
}

test("јавното пребарување не враќа DRAFT", async () => {
  const category = await firstCategory();
  const item = await createItem(payload({ categoryId: category.id, title: "Нацрт јавен", slug: "p3-draft", status: ItemStatus.DRAFT }));
  createdIds.push(item.id);
  const published = await getPublishedItems();
  const result = await searchPublicCatalog(filters({ q: "Нацрт јавен" }));
  assert.equal(published.some((row) => row.id === item.id), false);
  assert.equal(result.items.some((row) => row.id === item.id), false);
});

test("јавното пребарување не враќа ARCHIVED", async () => {
  const category = await firstCategory();
  const item = await createItem(payload({ categoryId: category.id, title: "Архива јавна", slug: "p3-archived" }));
  createdIds.push(item.id);
  await changeItemStatus(item.id, ItemStatus.ARCHIVED);
  const found = await getItemBySlug("p3-archived");
  const result = await searchPublicCatalog(filters({ q: "Архива јавна" }));
  assert.equal(found, null);
  assert.equal(result.items.some((row) => row.id === item.id), false);
});

test("SOLD останува јавно видлив", async () => {
  const category = await firstCategory();
  const item = await createItem(payload({ categoryId: category.id, title: "Продаден јавен P3", slug: "p3-sold" }));
  createdIds.push(item.id);
  await prisma.item.update({ where: { id: item.id }, data: { status: ItemStatus.SOLD } });
  const found = await getItemBySlug("p3-sold");
  assert.ok(found);
  assert.equal(found.status, ItemStatus.SOLD);
});

test("RESERVED не се прикажува како AVAILABLE", async () => {
  const category = await firstCategory();
  const item = await createItem(payload({ categoryId: category.id, title: "Резерва P3", slug: "p3-reserved" }));
  createdIds.push(item.id);
  const inquiry = await createItemInquiry({
    itemId: item.id,
    name: "Тест Купувач",
    email: `p3res${Date.now()}@example.com`,
    message: "Ме интересира овој предмет за колекција.",
  });
  const admin = await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
  assert.ok(admin);
  await reserveItem({ itemId: item.id, inquiryId: inquiry.id }, admin.id);
  const found = await getItemBySlug("p3-reserved");
  assert.ok(found);
  assert.equal(found.status, ItemStatus.RESERVED);
  assert.equal(isPurchasableStatus(found.status), false);
});

test("филтер по категорија", async () => {
  const watches = await prisma.category.findUnique({ where: { slug: "casovnici" } });
  const coins = await prisma.category.findUnique({ where: { slug: "moneti-i-banknoti" } });
  assert.ok(watches && coins);
  const watch = await createItem(payload({ categoryId: watches.id, title: "Часовник P3", slug: "p3-watch-cat" }));
  const coin = await createItem(payload({ categoryId: coins.id, title: "Монета P3", slug: "p3-coin-cat" }));
  createdIds.push(watch.id, coin.id);
  const result = await searchPublicCatalog(filters({ categorySlug: "casovnici", q: "P3" }));
  assert.equal(result.items.some((row) => row.id === watch.id), true);
  assert.equal(result.items.some((row) => row.id === coin.id), false);
});

test("пребарување по наслов", async () => {
  const category = await firstCategory();
  const item = await createItem(payload({ categoryId: category.id, title: "Единствен наслов P3xyz", slug: "p3-title-search" }));
  createdIds.push(item.id);
  const result = await searchPublicCatalog(filters({ q: "P3xyz" }));
  assert.equal(result.items.some((row) => row.id === item.id), true);
});

test("пребарување по референца", async () => {
  const category = await firstCategory();
  const item = await createItem(payload({ categoryId: category.id, title: "Референца P3", slug: "p3-ref-search" }));
  createdIds.push(item.id);
  const result = await searchPublicCatalog(filters({ q: item.referenceNumber }));
  assert.equal(result.items.some((row) => row.id === item.id), true);
});

test("сортирање по цена", async () => {
  const category = await firstCategory();
  const cheap = await createItem(payload({ categoryId: category.id, title: "Евтин P3", slug: "p3-cheap", price: "111" }));
  const costly = await createItem(payload({ categoryId: category.id, title: "Скап P3", slug: "p3-costly", price: "99999" }));
  createdIds.push(cheap.id, costly.id);
  const asc = await searchPublicCatalog(filters({ q: "P3", sort: "price-asc", pageSize: 50 }));
  const ids = asc.items.map((row) => row.id);
  assert.ok(ids.indexOf(cheap.id) < ids.indexOf(costly.id));
  const desc = await searchPublicCatalog(filters({ q: "P3", sort: "price-desc", pageSize: 50 }));
  const descIds = desc.items.map((row) => row.id);
  assert.ok(descIds.indexOf(costly.id) < descIds.indexOf(cheap.id));
});

test("пребарување по slug", async () => {
  const category = await firstCategory();
  const item = await createItem(payload({ categoryId: category.id, title: "Slug P3", slug: "p3-slug-lookup" }));
  createdIds.push(item.id);
  const found = await getItemBySlug("p3-slug-lookup");
  assert.ok(found);
  assert.equal(found.id, item.id);
});

test("непостоечки предмет", async () => {
  const found = await getItemBySlug("nema-ovakov-predmet-p3");
  assert.equal(found, null);
});

test("непостоечка категорија", async () => {
  const found = await getPublicCategoryBySlug("nema-ovakva-kategorija-p3");
  assert.equal(found, null);
});

test("пагинација", async () => {
  const category = await firstCategory();
  const first = await createItem(payload({ categoryId: category.id, title: "Страница А P3", slug: "p3-page-a" }));
  const second = await createItem(payload({ categoryId: category.id, title: "Страница Б P3", slug: "p3-page-b" }));
  createdIds.push(first.id, second.id);
  const page1 = await searchPublicCatalog(filters({ q: "Страница", page: 1, pageSize: 1 }));
  const page2 = await searchPublicCatalog(filters({ q: "Страница", page: 2, pageSize: 1 }));
  assert.equal(page1.items.length, 1);
  assert.equal(page2.items.length, 1);
  assert.notEqual(page1.items[0]?.id, page2.items[0]?.id);
  assert.ok(page1.pageCount >= 2);
});

after(async () => {
  if (createdIds.length) {
    await prisma.order.deleteMany({ where: { items: { some: { itemId: { in: createdIds } } } } });
    await prisma.reservation.deleteMany({ where: { itemId: { in: createdIds } } });
    await prisma.inquiry.deleteMany({ where: { itemId: { in: createdIds } } });
    await prisma.item.deleteMany({ where: { id: { in: createdIds } } });
  }
  await prisma.$disconnect();
});
