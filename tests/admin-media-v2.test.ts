import assert from "node:assert/strict";
import { after, test } from "node:test";
import { ItemStatus, MediaKind } from "@prisma/client";
import { prisma } from "../src/lib/db/prisma";
import { canHardDeleteItem, canTransitionItemStatus } from "../src/lib/domain/item-status";
import { matchesDeclaredImageType, matchesDeclaredVideoType } from "../src/lib/security/media-bytes";
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_ITEM,
  MAX_VIDEO_BYTES,
  MAX_VIDEOS_PER_ITEM,
} from "../src/lib/media/limits";
import { createItem } from "../src/server/services/item-service";
import {
  archiveItem,
  bulkArchiveItems,
  bulkDeleteItems,
  deleteItem,
} from "../src/server/services/item-service";
import { addItemMedia } from "../src/server/services/item-image-service";
import { createItemInquiry } from "../src/server/services/inquiry-service";
import { confirmSale, reserveItem } from "../src/server/services/commerce-service";

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
  const admin = await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
  assert.ok(admin);
  return admin.id;
}

async function makeItem(title: string, status: ItemStatus = ItemStatus.DRAFT) {
  seq += 1;
  const item = await createItem({
    title,
    slug: `v2-${seq}-${Date.now()}`,
    categoryId: await categoryId(),
    shortDescription: status === ItemStatus.DRAFT ? undefined : "Краток опис за v2.",
    description: "Опис.",
    price: "1200",
    currency: "MKD",
    status,
  });
  createdItemIds.push(item.id);
  return item;
}

function jpegBuffer(size = 64) {
  const buf = Buffer.alloc(Math.max(size, 16));
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xe0;
  return buf;
}

function pngBuffer() {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
}

function webpBuffer() {
  const buf = Buffer.alloc(16);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(8, 4);
  buf.write("WEBP", 8);
  return buf;
}

function mp4Buffer(size = 64) {
  const buf = Buffer.alloc(Math.max(size, 16));
  buf.write("....", 0);
  buf.write("ftyp", 4);
  buf.write("isom", 8);
  return buf;
}

test("AVAILABLE → RESERVED само преку commerce domain flag", () => {
  assert.equal(canTransitionItemStatus(ItemStatus.AVAILABLE, ItemStatus.RESERVED), false);
  assert.equal(canTransitionItemStatus(ItemStatus.AVAILABLE, ItemStatus.SOLD), false);
  assert.equal(canTransitionItemStatus(ItemStatus.AVAILABLE, ItemStatus.ARCHIVED), true);
});

test("safe draft delete", async () => {
  const item = await makeItem("V2 draft delete");
  assert.equal(canHardDeleteItem(ItemStatus.DRAFT, false), true);
  await deleteItem(item.id);
  createdItemIds.splice(createdItemIds.indexOf(item.id), 1);
  const gone = await prisma.item.findUnique({ where: { id: item.id } });
  assert.equal(gone, null);
});

test("delete blocked when Reservation exists", async () => {
  const item = await makeItem("V2 delete reserved", ItemStatus.AVAILABLE);
  const inquiry = await createItemInquiry({
    itemId: item.id,
    name: "V2",
    email: `v2r${Date.now()}@example.com`,
    message: "Ме интересира овој предмет за колекција.",
  });
  createdInquiryIds.push(inquiry.id);
  const reservation = await reserveItem({ itemId: item.id, inquiryId: inquiry.id }, await adminId());
  createdReservationIds.push(reservation.id);
  await assert.rejects(() => deleteItem(item.id));
});

test("delete blocked when Order exists", async () => {
  const item = await makeItem("V2 delete sold", ItemStatus.AVAILABLE);
  const inquiry = await createItemInquiry({
    itemId: item.id,
    name: "V2",
    email: `v2o${Date.now()}@example.com`,
    message: "Ме интересира овој предмет за колекција.",
  });
  createdInquiryIds.push(inquiry.id);
  const reservation = await reserveItem({ itemId: item.id, inquiryId: inquiry.id }, await adminId());
  createdReservationIds.push(reservation.id);
  const sale = await confirmSale(reservation.id, await adminId());
  createdOrderIds.push(sale.order.id);
  await assert.rejects(() => deleteItem(item.id));
  const order = await prisma.order.findUnique({ where: { id: sale.order.id }, include: { items: true } });
  assert.ok(order);
  assert.equal(order.items.length, 1);
});

test("single archive AVAILABLE → ARCHIVED", async () => {
  const item = await makeItem("V2 archive", ItemStatus.AVAILABLE);
  const archived = await archiveItem(item.id);
  assert.equal(archived.status, ItemStatus.ARCHIVED);
});

test("bulk archive rejects RESERVED/SOLD without partial silent success", async () => {
  const ok = await makeItem("V2 bulk arch ok", ItemStatus.AVAILABLE);
  const reserved = await makeItem("V2 bulk arch reserved", ItemStatus.AVAILABLE);
  const inquiry = await createItemInquiry({
    itemId: reserved.id,
    name: "V2",
    email: `v2b${Date.now()}@example.com`,
    message: "Ме интересира овој предмет за колекција.",
  });
  createdInquiryIds.push(inquiry.id);
  const reservation = await reserveItem({ itemId: reserved.id, inquiryId: inquiry.id }, await adminId());
  createdReservationIds.push(reservation.id);

  await assert.rejects(() => bulkArchiveItems([ok.id, reserved.id]));
  const still = await prisma.item.findUnique({ where: { id: ok.id } });
  assert.equal(still?.status, ItemStatus.AVAILABLE);
});

test("bulk archive succeeds for safe set", async () => {
  const a = await makeItem("V2 bulk a", ItemStatus.AVAILABLE);
  const b = await makeItem("V2 bulk b", ItemStatus.AVAILABLE);
  const result = await bulkArchiveItems([a.id, b.id]);
  assert.equal(result.archivedIds.length, 2);
});

test("bulk delete empty selection", async () => {
  await assert.rejects(() => bulkDeleteItems([]));
});

test("bulk delete rejects unsafe records", async () => {
  const draft = await makeItem("V2 bulk del draft");
  const reserved = await makeItem("V2 bulk del reserved", ItemStatus.AVAILABLE);
  const inquiry = await createItemInquiry({
    itemId: reserved.id,
    name: "V2",
    email: `v2d${Date.now()}@example.com`,
    message: "Ме интересира овој предмет за колекција.",
  });
  createdInquiryIds.push(inquiry.id);
  const reservation = await reserveItem({ itemId: reserved.id, inquiryId: inquiry.id }, await adminId());
  createdReservationIds.push(reservation.id);
  await assert.rejects(() => bulkDeleteItems([draft.id, reserved.id]));
  const still = await prisma.item.findUnique({ where: { id: draft.id } });
  assert.ok(still);
});

test("media magic bytes JPEG PNG WebP MP4", () => {
  assert.equal(matchesDeclaredImageType(jpegBuffer(), "image/jpeg"), true);
  assert.equal(matchesDeclaredImageType(pngBuffer(), "image/png"), true);
  assert.equal(matchesDeclaredImageType(webpBuffer(), "image/webp"), true);
  assert.equal(matchesDeclaredImageType(jpegBuffer(), "image/png"), false);
  assert.equal(matchesDeclaredVideoType(mp4Buffer(), "video/mp4"), true);
  assert.equal(matchesDeclaredVideoType(Buffer.from([0x00, 0x00, 0x00, 0x00]), "video/mp4"), false);
});

test("image size limits 30MB", async () => {
  const item = await makeItem("V2 image limits", ItemStatus.AVAILABLE);
  await assert.rejects(() =>
    addItemMedia({
      itemId: item.id,
      buffer: jpegBuffer(32),
      mimeType: "image/jpeg",
      sizeBytes: MAX_IMAGE_BYTES + 1,
    }),
  );
  const ok = await addItemMedia({
    itemId: item.id,
    buffer: jpegBuffer(32),
    mimeType: "image/jpeg",
    sizeBytes: MAX_IMAGE_BYTES,
  });
  assert.equal(ok.asset.kind, MediaKind.IMAGE);
});

test("invalid MIME / magic rejected", async () => {
  const item = await makeItem("V2 bad media", ItemStatus.AVAILABLE);
  await assert.rejects(() =>
    addItemMedia({
      itemId: item.id,
      buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
      mimeType: "image/jpeg",
      sizeBytes: 12,
    }),
  );
  await assert.rejects(() =>
    addItemMedia({
      itemId: item.id,
      buffer: jpegBuffer(),
      mimeType: "application/octet-stream",
      sizeBytes: 16,
    }),
  );
});

test("video accepted and size/count limits", async () => {
  const item = await makeItem("V2 video limits", ItemStatus.AVAILABLE);
  await assert.rejects(() =>
    addItemMedia({
      itemId: item.id,
      buffer: mp4Buffer(),
      mimeType: "video/mp4",
      sizeBytes: MAX_VIDEO_BYTES + 1,
    }),
  );

  for (let i = 0; i < MAX_VIDEOS_PER_ITEM; i += 1) {
    const row = await addItemMedia({
      itemId: item.id,
      buffer: mp4Buffer(),
      mimeType: "video/mp4",
      sizeBytes: 64,
    });
    assert.equal(row.asset.kind, MediaKind.VIDEO);
  }
  await assert.rejects(() =>
    addItemMedia({
      itemId: item.id,
      buffer: mp4Buffer(),
      mimeType: "video/mp4",
      sizeBytes: 64,
    }),
  );
  assert.equal(MAX_IMAGES_PER_ITEM >= 20, true);
});

test("PNG and WebP accepted", async () => {
  const item = await makeItem("V2 formats", ItemStatus.AVAILABLE);
  const png = await addItemMedia({
    itemId: item.id,
    buffer: pngBuffer(),
    mimeType: "image/png",
    sizeBytes: pngBuffer().length,
  });
  const webp = await addItemMedia({
    itemId: item.id,
    buffer: webpBuffer(),
    mimeType: "image/webp",
    sizeBytes: webpBuffer().length,
  });
  assert.equal(png.asset.mimeType, "image/png");
  assert.equal(webp.asset.mimeType, "image/webp");
});

after(async () => {
  if (createdOrderIds.length) await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
  if (createdReservationIds.length) {
    await prisma.reservation.deleteMany({ where: { id: { in: createdReservationIds } } });
  }
  if (createdInquiryIds.length) await prisma.inquiry.deleteMany({ where: { id: { in: createdInquiryIds } } });
  if (createdItemIds.length) {
    const images = await prisma.itemImage.findMany({
      where: { itemId: { in: createdItemIds } },
      include: { asset: true },
    });
    await prisma.itemImage.deleteMany({ where: { itemId: { in: createdItemIds } } });
    const assetIds = images.map((row) => row.assetId);
    if (assetIds.length) await prisma.mediaAsset.deleteMany({ where: { id: { in: assetIds } } });
    await prisma.item.deleteMany({ where: { id: { in: createdItemIds } } });
  }
  await prisma.$disconnect();
});
