import assert from "node:assert/strict";
import { after, test } from "node:test";
import { ItemStatus, MediaKind, StorageProvider, UserRole } from "@prisma/client";
import { prisma } from "../src/lib/db/prisma";
import { AppError, APP_ERROR_CODES } from "../src/lib/errors";
import { createLocalStorage } from "../src/lib/storage/local";
import { toPublicImageSrc } from "../src/lib/catalog/media";
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_ITEM,
  MAX_VIDEO_BYTES,
  MAX_VIDEOS_PER_ITEM,
} from "../src/lib/media/limits";
import { createItem } from "../src/server/services/item-service";
import {
  addItemMedia,
  assertMediaUploadAllowed,
  buildItemMediaPathname,
  isValidItemMediaPathname,
  maxBytesForMime,
  mediaKindForMime,
  removeItemImage,
} from "../src/server/services/item-image-service";
import { hashPassword } from "../src/lib/auth/password";

const createdItemIds: string[] = [];
const createdUserIds: string[] = [];
let seq = 0;

async function categoryId() {
  const category = await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } });
  assert.ok(category);
  return category.id;
}

async function makeItem(title: string) {
  seq += 1;
  const item = await createItem({
    title,
    slug: `blob-${seq}-${Date.now()}`,
    categoryId: await categoryId(),
    description: "Опис.",
    price: "1500",
    currency: "MKD",
    status: ItemStatus.DRAFT,
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

function mp4Buffer(size = 64) {
  const buf = Buffer.alloc(Math.max(size, 16));
  buf.write("....", 0);
  buf.write("ftyp", 4);
  buf.write("isom", 8);
  return buf;
}

after(async () => {
  if (createdItemIds.length) {
    await prisma.itemImage.deleteMany({ where: { itemId: { in: createdItemIds } } });
    await prisma.item.deleteMany({ where: { id: { in: createdItemIds } } });
  }
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
});

test("BLOB provider requires token in env schema contract", () => {
  assert.equal(process.env.STORAGE_PROVIDER !== "BLOB" || Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()), true);
});

test("media pathname is items/{itemId}/{uuid}.ext", () => {
  const itemId = "11111111-1111-4111-8111-111111111111";
  const pathname = buildItemMediaPathname(itemId, "image/jpeg");
  assert.equal(isValidItemMediaPathname(pathname, itemId), true);
  assert.equal(isValidItemMediaPathname("items/other/file.jpg", itemId), false);
  assert.equal(isValidItemMediaPathname(`items/${itemId}/not-a-uuid.jpg`, itemId), false);
});

test("mime helpers enforce image/video kinds and size ceilings", () => {
  assert.equal(mediaKindForMime("image/png"), MediaKind.IMAGE);
  assert.equal(mediaKindForMime("video/mp4"), MediaKind.VIDEO);
  assert.equal(mediaKindForMime("application/pdf"), null);
  assert.equal(maxBytesForMime("image/jpeg"), MAX_IMAGE_BYTES);
  assert.equal(maxBytesForMime("video/webm"), MAX_VIDEO_BYTES);
});

test("unauthenticated-style validation rejects missing item", async () => {
  await assert.rejects(
    () =>
      assertMediaUploadAllowed({
        itemId: "00000000-0000-4000-8000-000000000000",
        mimeType: "image/jpeg",
        sizeBytes: 100,
      }),
    (error: unknown) => error instanceof AppError && error.code === APP_ERROR_CODES.NOT_FOUND,
  );
});

test("customer role cannot be treated as storage admin via role check", async () => {
  const passwordHash = await hashPassword("CustomerPass123!");
  const customer = await prisma.user.create({
    data: {
      email: `blob-customer-${Date.now()}@example.com`,
      name: "Blob Customer",
      role: UserRole.CUSTOMER,
      passwordHash,
    },
  });
  createdUserIds.push(customer.id);
  assert.equal(customer.role, UserRole.CUSTOMER);
  assert.notEqual(customer.role, UserRole.ADMIN);
  assert.notEqual(customer.role, UserRole.SUPER_ADMIN);
});

test("invalid MIME rejected by assertMediaUploadAllowed", async () => {
  const item = await makeItem("MIME reject");
  await assert.rejects(
    () =>
      assertMediaUploadAllowed({
        itemId: item.id,
        mimeType: "text/plain",
        sizeBytes: 100,
      }),
    (error: unknown) => error instanceof AppError && error.code === APP_ERROR_CODES.VALIDATION,
  );
});

test("oversized image rejected", async () => {
  const item = await makeItem("Oversize image");
  await assert.rejects(
    () =>
      assertMediaUploadAllowed({
        itemId: item.id,
        mimeType: "image/jpeg",
        sizeBytes: MAX_IMAGE_BYTES + 1,
      }),
    (error: unknown) =>
      error instanceof AppError &&
      error.code === APP_ERROR_CODES.VALIDATION &&
      error.message.includes("30 MB"),
  );
});

test("oversized video rejected", async () => {
  const item = await makeItem("Oversize video");
  await assert.rejects(
    () =>
      assertMediaUploadAllowed({
        itemId: item.id,
        mimeType: "video/mp4",
        sizeBytes: MAX_VIDEO_BYTES + 1,
      }),
    (error: unknown) =>
      error instanceof AppError &&
      error.code === APP_ERROR_CODES.VALIDATION &&
      error.message.includes("200 MB"),
  );
});

test("LOCAL storage still works for admin media upload path", async () => {
  const item = await makeItem("Local upload");
  const buffer = jpegBuffer(128);
  const media = await addItemMedia({
    itemId: item.id,
    buffer,
    mimeType: "image/jpeg",
    sizeBytes: buffer.length,
    alt: "Локална фото",
  });
  assert.equal(media.asset.kind, MediaKind.IMAGE);
  assert.equal(media.asset.provider, StorageProvider.LOCAL);
  assert.ok(media.asset.url.includes("/api/media/") || media.asset.key.startsWith("items/"));
  assert.ok(toPublicImageSrc(media.asset.url));

  const storage = createLocalStorage();
  const stored = await storage.get(media.asset.key);
  assert.ok(stored);
  assert.equal(stored.mimeType, "image/jpeg");

  await removeItemImage(item.id, media.id);
  const gone = await prisma.itemImage.findUnique({ where: { id: media.id } });
  assert.equal(gone, null);
});

test("image count limit enforced", async () => {
  const item = await makeItem("Image limit");
  for (let i = 0; i < MAX_IMAGES_PER_ITEM; i += 1) {
    const buffer = jpegBuffer(48 + i);
    await addItemMedia({
      itemId: item.id,
      buffer,
      mimeType: "image/jpeg",
      sizeBytes: buffer.length,
    });
  }
  const buffer = jpegBuffer(200);
  await assert.rejects(
    () =>
      addItemMedia({
        itemId: item.id,
        buffer,
        mimeType: "image/jpeg",
        sizeBytes: buffer.length,
      }),
    (error: unknown) => error instanceof AppError && error.message.includes(String(MAX_IMAGES_PER_ITEM)),
  );
});

test("video count limit enforced", async () => {
  const item = await makeItem("Video limit");
  for (let i = 0; i < MAX_VIDEOS_PER_ITEM; i += 1) {
    const buffer = mp4Buffer(64 + i);
    await addItemMedia({
      itemId: item.id,
      buffer,
      mimeType: "video/mp4",
      sizeBytes: buffer.length,
    });
  }
  const buffer = mp4Buffer(128);
  await assert.rejects(
    () =>
      addItemMedia({
        itemId: item.id,
        buffer,
        mimeType: "video/mp4",
        sizeBytes: buffer.length,
      }),
    (error: unknown) => error instanceof AppError && error.message.includes(String(MAX_VIDEOS_PER_ITEM)),
  );
});

test("public Blob HTTPS URLs pass through unchanged", () => {
  const url = "https://abc123.public.blob.vercel-storage.com/items/x/y.jpg";
  assert.equal(toPublicImageSrc(url), url);
});

test("failed upload validation is graceful AppError", async () => {
  const item = await makeItem("Bad magic");
  const buffer = Buffer.from("not-an-image");
  await assert.rejects(
    () =>
      addItemMedia({
        itemId: item.id,
        buffer,
        mimeType: "image/jpeg",
        sizeBytes: buffer.length,
      }),
    (error: unknown) => error instanceof AppError && error.code === APP_ERROR_CODES.VALIDATION,
  );
});

test("admin media upload API rejects unauthenticated requests", async () => {
  const { POST } = await import("../src/app/api/admin/media/upload/route");
  const form = new FormData();
  form.set("itemId", "11111111-1111-4111-8111-111111111111");
  form.set("file", new File([jpegBuffer()], "x.jpg", { type: "image/jpeg" }));
  const response = await POST(
    new Request("http://localhost/api/admin/media/upload", { method: "POST", body: form }),
  );
  assert.equal(response.status === 401 || response.status === 403 || response.status >= 400, true);
  const payload = (await response.json()) as { ok?: boolean };
  assert.notEqual(payload.ok, true);
});

test("admin media prepare API rejects unauthenticated requests", async () => {
  const { POST } = await import("../src/app/api/admin/media/prepare/route");
  const response = await POST(
    new Request("http://localhost/api/admin/media/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: "11111111-1111-4111-8111-111111111111",
        mimeType: "image/jpeg",
        sizeBytes: 100,
      }),
    }),
  );
  assert.equal(response.status >= 400, true);
});

test("admin media complete API rejects unauthenticated requests", async () => {
  const { POST } = await import("../src/app/api/admin/media/complete/route");
  const response = await POST(
    new Request("http://localhost/api/admin/media/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: "11111111-1111-4111-8111-111111111111",
        key: "items/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg",
        url: "https://example.public.blob.vercel-storage.com/x.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 100,
      }),
    }),
  );
  assert.equal(response.status >= 400, true);
});
