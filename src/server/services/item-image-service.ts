import { randomUUID } from "node:crypto";
import path from "node:path";
import { MediaKind } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";
import { env } from "@/lib/env";
import { getObjectStorage } from "@/lib/storage";
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

const IMAGE_TYPES = new Set<string>(IMAGE_MIME_TYPES);
const VIDEO_TYPES = new Set<string>(VIDEO_MIME_TYPES);

function extensionFor(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "video/mp4") return "mp4";
  if (mimeType === "video/webm") return "webm";
  return "jpg";
}

function kindFor(mimeType: string): MediaKind {
  return VIDEO_TYPES.has(mimeType) ? MediaKind.VIDEO : MediaKind.IMAGE;
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
  const item = await findItemById(input.itemId);
  if (!item) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Предметот не е пронајден.", 404);
  }

  const mimeType = input.mimeType.toLowerCase();
  const isImage = IMAGE_TYPES.has(mimeType);
  const isVideo = VIDEO_TYPES.has(mimeType);
  if (!isImage && !isVideo) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Дозволени се JPG, PNG, WebP, MP4 и WebM.", 400);
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (input.sizeBytes > maxBytes) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      isVideo ? "Видеото е поголемо од 200 MB." : "Фотографијата е поголема од 30 MB.",
      400,
    );
  }

  if (!matchesDeclaredMediaType(input.buffer, mimeType)) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      isVideo ? "Датотеката не е валидно видео." : "Датотеката не е валидна фотографија.",
      400,
    );
  }

  const kind = kindFor(mimeType);
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

  const key = path.posix.join("items", input.itemId, `${randomUUID()}.${extensionFor(mimeType)}`);
  const stored = await getObjectStorage().put({
    key,
    body: input.buffer,
    mimeType,
  });

  const isFirstImage = kind === MediaKind.IMAGE && item.images.every((row) => row.asset.kind !== MediaKind.IMAGE);

  return prisma.$transaction(async (tx) => {
    const asset = await tx.mediaAsset.create({
      data: {
        key: stored.key,
        url: stored.url,
        provider: env.STORAGE_PROVIDER,
        kind,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        alt: input.alt?.trim() || (kind === MediaKind.IMAGE ? item.title : null),
        durationSeconds: kind === MediaKind.VIDEO ? input.durationSeconds ?? null : null,
      },
    });

    return tx.itemImage.create({
      data: {
        itemId: input.itemId,
        assetId: asset.id,
        sortOrder: item.images.length,
        isPrimary: isFirstImage,
      },
      include: { asset: true },
    });
  });
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

  await prisma.itemImage.delete({ where: { id: imageId } });

  const stillUsed = await prisma.itemImage.count({ where: { assetId: image.assetId } });
  if (stillUsed === 0) {
    await getObjectStorage().delete(image.asset.key);
    await prisma.mediaAsset.delete({ where: { id: image.assetId } });
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
