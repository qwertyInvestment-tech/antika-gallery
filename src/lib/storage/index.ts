import { env } from "@/lib/env";
import { createLocalStorage } from "@/lib/storage/local";
import type { ObjectStorage } from "@/lib/storage/types";

export function getObjectStorage(): ObjectStorage {
  if (env.STORAGE_PROVIDER === "LOCAL") {
    return createLocalStorage();
  }

  throw new Error(
    `Складирањето ${env.STORAGE_PROVIDER} е подготвено во шемата, но адаптерот ќе се поврзе во подоцнежна фаза.`,
  );
}
