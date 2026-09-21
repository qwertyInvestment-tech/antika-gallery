import path from "node:path";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { env } from "@/lib/env";
import type { ObjectStorage, StoredObject, StoredObjectBody } from "@/lib/storage/types";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function resolveSafe(root: string, key: string) {
  const filePath = path.resolve(root, key);
  if (!filePath.startsWith(path.resolve(root))) {
    throw new Error("Невалиден клуч за складирање.");
  }
  return filePath;
}

function localPublicPath(key: string) {
  const configured = env.STORAGE_PUBLIC_BASE_URL;
  const useSameOrigin =
    !configured || configured.startsWith("http://") || configured.startsWith("https://");
  const base = useSameOrigin ? "/api/media" : configured.replace(/\/$/, "");
  const normalized = key.replaceAll("\\", "/").replace(/^\/+/, "");
  return `${base}/${normalized}`;
}

export function createLocalStorage(): ObjectStorage {
  const root = path.resolve(env.STORAGE_LOCAL_DIR);

  return {
    async put({ key, body, mimeType }): Promise<StoredObject> {
      const filePath = resolveSafe(root, key);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, body);
      return {
        key,
        url: localPublicPath(key),
        mimeType,
        sizeBytes: body.byteLength,
      };
    },
    async get(key): Promise<StoredObjectBody | null> {
      try {
        const filePath = resolveSafe(root, key);
        const body = await readFile(filePath);
        return {
          body,
          mimeType: MIME_BY_EXT[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
        };
      } catch {
        return null;
      }
    },
    async delete(key) {
      const filePath = resolveSafe(root, key);
      await unlink(filePath).catch(() => undefined);
    },
    getPublicUrl(key) {
      return localPublicPath(key);
    },
  };
}
