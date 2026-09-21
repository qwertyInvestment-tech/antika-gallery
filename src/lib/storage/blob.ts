import { del, put } from "@vercel/blob";
import { env } from "@/lib/env";
import type { ObjectStorage, StoredObject, StoredObjectBody } from "@/lib/storage/types";

function blobToken() {
  const token = env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN не е конфигуриран.");
  }
  return token;
}

export function createBlobStorage(): ObjectStorage {
  return {
    async put({ key, body, mimeType }): Promise<StoredObject> {
      const result = await put(key, body, {
        access: "public",
        contentType: mimeType,
        addRandomSuffix: false,
        token: blobToken(),
      });
      return {
        key,
        url: result.url,
        mimeType,
        sizeBytes: body.byteLength,
      };
    },
    async get(): Promise<StoredObjectBody | null> {
      // Blob media is served from absolute public URLs on MediaAsset.url.
      // `/api/media` remains for LOCAL assets only.
      return null;
    },
    async delete(keyOrUrl) {
      await del(keyOrUrl, { token: blobToken() });
    },
    getPublicUrl(key) {
      // Absolute public URL is always persisted from put()/client upload.
      return key;
    },
  };
}
