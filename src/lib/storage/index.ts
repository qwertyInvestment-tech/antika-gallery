import { env } from "@/lib/env";
import { createBlobStorage } from "@/lib/storage/blob";
import { createLocalStorage } from "@/lib/storage/local";
import type { ObjectStorage } from "@/lib/storage/types";

export function isBlobStorageEnabled() {
  return env.STORAGE_PROVIDER === "BLOB";
}

export function getObjectStorage(): ObjectStorage {
  if (env.STORAGE_PROVIDER === "LOCAL") {
    return createLocalStorage();
  }

  if (env.STORAGE_PROVIDER === "BLOB") {
    return createBlobStorage();
  }

  throw new Error(
    `Складирањето ${env.STORAGE_PROVIDER} е подготвено во шемата, но адаптерот ќе се поврзе во подоцнежна фаза.`,
  );
}

export function getStorageForProvider(provider: string): ObjectStorage {
  if (provider === "BLOB") return createBlobStorage();
  if (provider === "LOCAL") return createLocalStorage();
  return getObjectStorage();
}
