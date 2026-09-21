import { randomUUID } from "node:crypto";
import path from "node:path";
import { MediaKind, StorageProvider } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";
import { env } from "@/lib/env";
import { getObjectStorage, getStorageForProvider } from "@/lib/storage";
import { matchesDeclaredMediaType } from "@/lib/security/media-bytes";
import {
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_ITEM,
  MAX_VIDEO_BYTES,
  MAX_VIDEOS_PER_ITEM,
  VIDEO_MIME_TYPES,
} from "@/lib/media/limits";
import { findItemById } from "@/server/repositories/item-repository";

export {
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MAX_IMAGES_PER_ITEM,
  MAX_VIDEOS_PER_ITEM,
} from "@/lib/media/limits";

function extensionFor(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "video/mp4") return "mp4";
  if (mimeType === "video/webm") return "webm";
  return "jpg";
}

const IMAGE_TYPES = new Set<string>(IMAGE_MIME_TYPES);
const VIDEO_TYPES = new Set<string>(VIDEO_MIME_TYPES);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function mediaKindForMime(mimeType: string): MediaKind | null {
  const normalized = mimeType.toLowerCase();
  if (IMAGE_TYPES.has(normalized)) return MediaKind.IMAGE;
  if (VIDEO_TYPES.has(normalized)) return MediaKind.VIDEO;
  return null;
}

export function maxBytesForMime(mimeType: string) {
  return VIDEO_TYPES.has(mimeType.toLowerCase()) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

export function buildItemMediaPathname(itemId: string, mimeType: string) {
  return path.posix.join("items", itemId, `${randomUUID()}.${extensionFor(mimeType.toLowerCase())}`);
}

export function isValidItemMediaPathname(pathname: string, itemId: string) {
  const parts = pathname.replace(/^\/+/, "").split("/");
  if (parts.length !== 3) return false;
  if (parts[0] !== "items" || parts[1] !== itemId) return false;
  const [name, ext] = (() => {
    const file = parts[2] ?? "";
    const dot = file.lastIndexOf(".");
    if (dot <= 0) return ["", ""];
    return [file.slice(0, dot), file.slice(dot + 1).toLowerCase()];
  })();
  if (!UUID_RE.test(name)) return false;
  return ["jpg", "jpeg", "png", "webp", "mp4", "webm"].includes(ext);
}

type ItemWithMedia = NonNullable<Awaited<ReturnType<typeof findItemById>>>;

export async function assertMediaUploadAllowed(input: {
  itemId: string;
  mimeType: string;
  sizeBytes: number;
  item?: ItemWithMedia | null;
}) {
  const item = input.item ?? (await findItemById(input.itemId));
  if (!item) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Предметот не е пронајден.", 404);
  }

  const mimeType = input.mimeType.toLowerCase();
  const kind = mediaKindForMime(mimeType);
  if (!kind) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Дозволени се JPG, PNG, WebP, MP4 и WebM.", 400);
  }

  const maxBytes = maxBytesForMime(mimeType);
  if (input.sizeBytes > maxBytes) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      kind === MediaKind.VIDEO ? "Видеото е поголемо од 200 MB." : "Фотографијата е поголема од 30 MB.",
      400,
    );
  }

  const existingOfKind = item.images.filter((row) => row.asset.kind === kind).length;
  const maxOfKind = kind === MediaKind.VIDEO ? MAX_VIDEOS_PER_ITEM : MAX_IMAGES_PER_ITEM;
  if (existingOfKind >= maxOfKind) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      kind === MediaKind.VIDEO
        ? `Дозволени се најмногу ${MAX_VIDEOS_PER_ITEM} видеа по предмет.`
        : `Дозволени се најмногу ${MAX_IMAGES_PER_ITEM} фотографии по предмет.`,
      400,
    );
  }

  return { item, mimeType, kind, maxBytes };
}

async function createMediaLink(input: {
  item: ItemWithMedia;
  key: string;
  url: string;
  mimeType: string;
  sizeBytes?: number;
  kind: MediaKind;
  provider: StorageProvider;
  alt?: string;
  durationSeconds?: number | null;
}) {
  const isFirstImage =
    input.kind === MediaKind.IMAGE && input.item.images.every((row) => row.asset.kind !== MediaKind.IMAGE);

  return prisma.$transaction(async (tx) => {
    const asset = await tx.mediaAsset.create({
      data: {
        key: input.key,
        url: input.url,
        provider: input.provider,
        kind: input.kind,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        alt: input.alt?.trim() || (input.kind === MediaKind.IMAGE ? input.item.title : null),
        durationSeconds: input.kind === MediaKind.VIDEO ? input.durationSeconds ?? null : null,
      },
    });

    return tx.itemImage.create({
      data: {
        itemId: input.item.id,
        assetId: asset.id,
        sortOrder: input.item.images.length,
        isPrimary: isFirstImage,
      },
      include: { asset: true },
    });
  });
}

export type MediaUploadInput = {
  itemId: string;
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
  alt?: string;
  durationSeconds?: number | null;
};

export async function addItemMedia(input: MediaUploadInput) {
  const { item, mimeType, kind } = await assertMediaUploadAllowed(input);

  if (!matchesDeclaredMediaType(input.buffer, mimeType)) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      kind === MediaKind.VIDEO ? "Датотеката не е валидно видео." : "Датотеката не е валидна фотографија.",
      400,
    );
  }

  const key = buildItemMediaPathname(input.itemId, mimeType);
  const stored = await getObjectStorage().put({
    key,
    body: input.buffer,
    mimeType,
  });

  return createMediaLink({
    item,
    key: stored.key,
    url: stored.url,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
    kind,
    provider: env.STORAGE_PROVIDER as StorageProvider,
    alt: input.alt,
    durationSeconds: input.durationSeconds,
  });
}

export async function prepareBlobMediaUpload(input: {
  itemId: string;
  mimeType: string;
  sizeBytes: number;
}) {
  if (env.STORAGE_PROVIDER !== "BLOB") {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Blob складирањето не е активно.", 400);
  }
  const { mimeType, kind, maxBytes } = await assertMediaUploadAllowed(input);
  const pathname = buildItemMediaPathname(input.itemId, mimeType);
  return { pathname, mimeType, kind, maxBytes };
}

export async function registerBlobMedia(input: {
  itemId: string;
  key: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  alt?: string;
  durationSeconds?: number | null;
}) {
  if (env.STORAGE_PROVIDER !== "BLOB") {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Blob складирањето не е активно.", 400);
  }
  if (!isValidItemMediaPathname(input.key, input.itemId)) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Невалиден клуч за медиум.", 400);
  }
  if (!input.url.startsWith("https://")) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Невалиден URL за медиум.", 400);
  }

  const { item, mimeType, kind } = await assertMediaUploadAllowed(input);

  const head = await fetchBlobMagicBytes(input.url);
  if (!matchesDeclaredMediaType(head, mimeType)) {
    try {
      await getStorageForProvider("BLOB").delete(input.url);
    } catch (error) {
      console.error("blob cleanup after invalid media failed", error);
    }
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      kind === MediaKind.VIDEO ? "Датотеката не е валидно видео." : "Датотеката не е валидна фотографија.",
      400,
    );
  }

  try {
    return await createMediaLink({
      item,
      key: input.key,
      url: input.url,
      mimeType,
      sizeBytes: input.sizeBytes,
      kind,
      provider: StorageProvider.BLOB,
      alt: input.alt,
      durationSeconds: input.durationSeconds,
    });
  } catch (error) {
    try {
      await getStorageForProvider("BLOB").delete(input.url);
    } catch (cleanupError) {
      console.error("blob cleanup after DB failure", cleanupError);
    }
    throw error;
  }
}

async function fetchBlobMagicBytes(url: string) {
  const response = await fetch(url, {
    headers: { Range: "bytes=0-63" },
  });
  if (!response.ok && response.status !== 206) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Прикачувањето не успеа. Обидете се повторно.", 400);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function addItemImage(itemId: string, file: File, alt?: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return addItemMedia({
    itemId,
    buffer,
    mimeType: file.type,
    sizeBytes: file.size,
    alt,
  });
}

export async function setPrimaryImage(itemId: string, imageId: string) {
  const image = await prisma.itemImage.findFirst({
    where: { id: imageId, itemId },
    include: { asset: true },
  });
  if (!image) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Медиумот не е пронајден.", 404);
  }
  if (image.asset.kind !== MediaKind.IMAGE) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Само фотографија може да биде главна.", 400);
  }

  await prisma.$transaction([
    prisma.itemImage.updateMany({ where: { itemId }, data: { isPrimary: false } }),
    prisma.itemImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);
}

export async function updateImageAlt(imageId: string, itemId: string, alt: string) {
  const image = await prisma.itemImage.findFirst({
    where: { id: imageId, itemId },
    include: { asset: true },
  });
  if (!image) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Медиумот не е пронајден.", 404);
  }
  await prisma.mediaAsset.update({
    where: { id: image.assetId },
    data: { alt: alt.trim().slice(0, 180) || null },
  });
}

export async function reorderItemImages(itemId: string, imageIds: string[]) {
  const images = await prisma.itemImage.findMany({ where: { itemId }, select: { id: true } });
  const existing = new Set(images.map((image) => image.id));
  if (imageIds.length !== existing.size || imageIds.some((id) => !existing.has(id))) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Редоследот на медиумите е невалиден.", 400);
  }

  await prisma.$transaction(
    imageIds.map((id, index) => prisma.itemImage.update({ where: { id }, data: { sortOrder: index } })),
  );
}

export async function removeItemImage(itemId: string, imageId: string) {
  const image = await prisma.itemImage.findFirst({
    where: { id: imageId, itemId },
    include: { asset: true },
  });
  if (!image) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Медиумот не е пронајден.", 404);
  }

  const stillUsed = await prisma.itemImage.count({
    where: { assetId: image.assetId, NOT: { id: imageId } },
  });

  if (stillUsed === 0) {
    try {
      const storage = getStorageForProvider(image.asset.provider);
      const target =
        image.asset.provider === StorageProvider.BLOB ? image.asset.url : image.asset.key;
      await storage.delete(target);
    } catch (error) {
      console.error("media storage delete failed", { assetId: image.assetId, error });
      if (image.asset.provider === StorageProvider.BLOB) {
        throw new AppError(APP_ERROR_CODES.INTERNAL, "Медиумот не може да се отстрани.", 500);
      }
    }
  }

  await prisma.itemImage.delete({ where: { id: imageId } });

  if (stillUsed === 0) {
    try {
      await prisma.mediaAsset.delete({ where: { id: image.assetId } });
    } catch (error) {
      console.error("media asset DB delete failed after storage delete", {
        assetId: image.assetId,
        error,
      });
      throw new AppError(APP_ERROR_CODES.INTERNAL, "Медиумот не може да се отстрани.", 500);
    }
  }

  if (image.isPrimary) {
    const next = await prisma.itemImage.findFirst({
      where: { itemId, asset: { kind: MediaKind.IMAGE } },
      orderBy: { sortOrder: "asc" },
    });
    if (next) {
      await prisma.itemImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
  }
}
