import { ItemStatus } from "@prisma/client";

export const PUBLIC_ITEM_STATUSES = [
  ItemStatus.PUBLISHED,
  ItemStatus.AVAILABLE,
  ItemStatus.RESERVED,
  ItemStatus.SOLD,
] as const;

export const PUBLIC_FILTER_STATUSES = [
  ItemStatus.AVAILABLE,
  ItemStatus.RESERVED,
  ItemStatus.SOLD,
  ItemStatus.PUBLISHED,
] as const;

export type PublicSort = "newest" | "price-asc" | "price-desc";

export type PublicCatalogFilters = {
  q?: string;
  categorySlug?: string;
  status?: ItemStatus;
  minPrice?: string;
  maxPrice?: string;
  period?: string;
  origin?: string;
  material?: string;
  sort: PublicSort;
  page: number;
  pageSize: number;
};

const SORT_ALIASES: Record<string, PublicSort> = {
  newest: "newest",
  najnovi: "newest",
  "price-asc": "price-asc",
  "cena-asc": "price-asc",
  "cena-rastechki": "price-asc",
  "price-desc": "price-desc",
  "cena-desc": "price-desc",
  "cena-opagjachki": "price-desc",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function text(value: string | undefined) {
  const next = value?.trim();
  return next ? next : undefined;
}

function money(value: string | undefined) {
  const next = text(value);
  if (!next || !/^\d+(\.\d{1,2})?$/.test(next)) return undefined;
  return next;
}

function pageNumber(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parsePublicCatalogParams(
  raw: Record<string, string | string[] | undefined>,
  pageSize = 8,
): PublicCatalogFilters {
  const statusRaw = text(first(raw.статус) ?? first(raw.status));
  const status = PUBLIC_FILTER_STATUSES.find((value) => value === statusRaw);

  return {
    q: text(first(raw.q) ?? first(raw.барање)),
    categorySlug: text(first(raw.категорија) ?? first(raw.kategorija)),
    status,
    minPrice: money(first(raw["цена-од"]) ?? first(raw.min)),
    maxPrice: money(first(raw["цена-до"]) ?? first(raw.max)),
    period: text(first(raw.период) ?? first(raw.period)),
    origin: text(first(raw.потекло) ?? first(raw.origin)),
    material: text(first(raw.материјал) ?? first(raw.material)),
    sort: SORT_ALIASES[text(first(raw.сортирај) ?? first(raw.sort)) ?? "newest"] ?? "newest",
    page: pageNumber(first(raw.страница) ?? first(raw.page)),
    pageSize,
  };
}

export function catalogSearchParams(filters: Partial<PublicCatalogFilters>) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.categorySlug) params.set("категорија", filters.categorySlug);
  if (filters.status) params.set("статус", filters.status);
  if (filters.minPrice) params.set("цена-од", filters.minPrice);
  if (filters.maxPrice) params.set("цена-до", filters.maxPrice);
  if (filters.period) params.set("период", filters.period);
  if (filters.origin) params.set("потекло", filters.origin);
  if (filters.material) params.set("материјал", filters.material);
  if (filters.sort && filters.sort !== "newest") params.set("сортирај", filters.sort);
  if (filters.page && filters.page > 1) params.set("страница", String(filters.page));
  return params;
}

export function catalogHref(path: string, filters: Partial<PublicCatalogFilters>) {
  const params = catalogSearchParams(filters);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
