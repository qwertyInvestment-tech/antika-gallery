export type FavoriteRef = {
  id: string;
  slug: string;
  reference: string;
};

export const FAVORITES_STORAGE_KEY = "antika:favorites";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function readFavorites(storage: StorageLike): FavoriteRef[] {
  try {
    const raw = storage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isFavoriteRef);
  } catch {
    return [];
  }
}

export function writeFavorites(storage: StorageLike, items: FavoriteRef[]) {
  storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
  return items;
}

export function hasFavorite(items: FavoriteRef[], id: string) {
  return items.some((item) => item.id === id);
}

export function addFavorite(items: FavoriteRef[], next: FavoriteRef) {
  if (hasFavorite(items, next.id)) return items;
  return [...items, next];
}

export function removeFavorite(items: FavoriteRef[], id: string) {
  return items.filter((item) => item.id !== id);
}

function isFavoriteRef(value: unknown): value is FavoriteRef {
  if (!value || typeof value !== "object") return false;
  const row = value as FavoriteRef;
  return Boolean(row.id && row.slug && row.reference);
}
