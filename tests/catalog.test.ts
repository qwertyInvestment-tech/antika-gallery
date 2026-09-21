import assert from "node:assert/strict";
import { after, test } from "node:test";
import { ItemStatus } from "@prisma/client";
import { prisma } from "../src/lib/db/prisma";
import { canTransitionItemStatus } from "../src/lib/domain/item-status";
import { formatItemReference } from "../src/lib/domain/reference-number";
import { getItemBySlug, getPublishedItems } from "../src/server/catalog/queries";
import { changeItemStatus, createItem, updateItem } from "../src/server/services/item-service";
import { listAdminItems } from "../src/server/repositories/item-repository";

const createdIds: string[] = [];

function payload(overrides: Record<string, unknown> = {}) {
  return {
    title: "Тест предмет",
    slug: "",
    categoryId: "",
    shortDescription: "Краток опис за тест.",
    description: "Опис.",
    price: "1000",
    currency: "MKD",
    status: ItemStatus.DRAFT,
    ...overrides,
  };
}

async function firstCategoryId() {
  const category = await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } });
  assert.ok(category, "Потребна е барем една категорија.");
  return category.id;
}

test("референтниот број е човечки и уникатен", async () => {
  assert.equal(formatItemReference(1), "ANT-000001");
  const categoryId = await firstCategoryId();
  const first = await createItem(payload({ categoryId, title: "Тест референца А" }));
  const second = await createItem(payload({ categoryId, title: "Тест референца Б" }));
  createdIds.push(first.id, second.id);
  assert.notEqual(first.referenceNumber, second.referenceNumber);
  assert.match(first.referenceNumber, /^ANT-\d{6}$/);
});

test("slug е уникатен", async () => {
  const categoryId = await firstCategoryId();
  const first = await createItem(payload({ categoryId, title: "Ист наслов", slug: "test-slug-unique" }));
  const second = await createItem(payload({ categoryId, title: "Ист наслов", slug: "test-slug-unique" }));
  createdIds.push(first.id, second.id);
  assert.equal(first.slug, "test-slug-unique");
  assert.equal(second.slug, "test-slug-unique-2");
});

test("валидно креирање и врска со категорија", async () => {
  const categoryId = await firstCategoryId();
  const item = await createItem(payload({ categoryId, title: "Валиден предмет" }));
  createdIds.push(item.id);
  assert.equal(item.categoryId, categoryId);
  assert.equal(item.status, ItemStatus.DRAFT);
});

test("невалидно креирање се одбива", async () => {
  await assert.rejects(() => createItem(payload({ title: "А", categoryId: "not-a-uuid" })));
});

test("непостоечка категорија се одбива", async () => {
  await assert.rejects(() =>
    createItem(payload({ categoryId: "00000000-0000-0000-0000-000000000099" })),
  );
});

test("валиден премин DRAFT → AVAILABLE", async () => {
  assert.equal(canTransitionItemStatus(ItemStatus.DRAFT, ItemStatus.AVAILABLE), true);
  const categoryId = await firstCategoryId();
  const item = await createItem(payload({ categoryId, title: "За објава", status: ItemStatus.AVAILABLE }));
  createdIds.push(item.id);
  assert.equal(item.status, ItemStatus.AVAILABLE);
});

test("SOLD не може во AVAILABLE", async () => {
  assert.equal(canTransitionItemStatus(ItemStatus.SOLD, ItemStatus.AVAILABLE), false);
  const categoryId = await firstCategoryId();
  const item = await createItem(payload({ categoryId, title: "Продаден тест", status: ItemStatus.AVAILABLE }));
  createdIds.push(item.id);
  await prisma.item.update({ where: { id: item.id }, data: { status: ItemStatus.SOLD } });
  await assert.rejects(() => changeItemStatus(item.id, ItemStatus.AVAILABLE));
});

test("нацрт не е јавно видлив", async () => {
  const categoryId = await firstCategoryId();
  const item = await createItem(payload({ categoryId, title: "Скриен нацрт", slug: "test-draft-hidden" }));
  createdIds.push(item.id);
  const found = await getItemBySlug(item.slug);
  assert.equal(found, null);
  const published = await getPublishedItems();
  assert.equal(published.some((row) => row.id === item.id), false);
});

test("објавен предмет се наоѓа", async () => {
  const categoryId = await firstCategoryId();
  const item = await createItem(
    payload({
      categoryId,
      title: "Јавен предмет",
      slug: "test-public-item",
      status: ItemStatus.AVAILABLE,
    }),
  );
  createdIds.push(item.id);
  const found = await getItemBySlug(item.slug);
  assert.ok(found);
  assert.equal(found.id, item.id);
});

test("продаден предмет останува достапен за пребарување", async () => {
  const categoryId = await firstCategoryId();
  const item = await createItem(
    payload({
      categoryId,
      title: "Продаден јавен",
      slug: "test-sold-visible",
      status: ItemStatus.AVAILABLE,
    }),
  );
  createdIds.push(item.id);
  await prisma.item.update({ where: { id: item.id }, data: { status: ItemStatus.SOLD } });
  const found = await getItemBySlug(item.slug);
  assert.ok(found);
  assert.equal(found.status, ItemStatus.SOLD);
});

test("архивиран предмет не е во активниот каталог", async () => {
  const categoryId = await firstCategoryId();
  const item = await createItem(
    payload({
      categoryId,
      title: "За архива",
      slug: "test-archived-hidden",
      status: ItemStatus.AVAILABLE,
    }),
  );
  createdIds.push(item.id);
  await changeItemStatus(item.id, ItemStatus.ARCHIVED);
  const found = await getItemBySlug(item.slug);
  assert.equal(found, null);
});

test("насловот може да се смени без промена на постоечки slug", async () => {
  const categoryId = await firstCategoryId();
  const item = await createItem(payload({ categoryId, title: "Прв наслов", slug: "stabilen-slug" }));
  createdIds.push(item.id);
  const updated = await updateItem(item.id, payload({ categoryId, title: "Втор наслов", slug: "stabilen-slug" }));
  assert.equal(updated.slug, "stabilen-slug");
  assert.equal(updated.title, "Втор наслов");
});

test("admin пребарување наоѓа повеќе зборови и интерпункција", async () => {
  const categoryId = await firstCategoryId();
  const item = await createItem(
    payload({ categoryId, title: "QA — ANTIKA ADMIN AUDIT", slug: "qa-search-tokens" }),
  );
  createdIds.push(item.id);
  const { items } = await listAdminItems({
    q: "QA ANTIKA ADMIN",
    sort: "createdAt",
    order: "desc",
    page: 1,
  });
  assert.equal(items.some((row) => row.id === item.id), true);

  const mk = await createItem(
    payload({ categoryId, title: "Сребрен привезок од Охрид", slug: "srebren-privezok-ohrid" }),
  );
  createdIds.push(mk.id);
  const mkResult = await listAdminItems({
    q: "сребрен охрид",
    sort: "createdAt",
    order: "desc",
    page: 1,
  });
  assert.equal(mkResult.items.some((row) => row.id === mk.id), true);
});

after(async () => {
  if (createdIds.length) {
    await prisma.item.deleteMany({ where: { id: { in: createdIds } } });
  }
  await prisma.$disconnect();
});
