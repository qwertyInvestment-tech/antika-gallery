import Link from "next/link";
import { catalogHref } from "@/lib/catalog/public-query";
import type { PublicCatalogFilters } from "@/lib/catalog/public-query";

export function CatalogPagination({
  path,
  filters,
  page,
  pageCount,
  total,
}: {
  path: string;
  filters: PublicCatalogFilters;
  page: number;
  pageCount: number;
  total: number;
}) {
  if (total === 0) return null;

  return (
    <nav className="mt-16 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between" aria-label="Страници">
      <p className="text-sm text-muted">
        {total === 1 ? "Еден предмет" : `${total} предмети`} · страница {page} од {pageCount}
      </p>
      <div className="flex gap-3">
        {page > 1 ? (
          <Link
            href={catalogHref(path, { ...filters, page: page - 1 })}
            className="border border-ink/20 px-4 py-2 text-[0.72rem] tracking-[0.16em] uppercase"
          >
            Претходна
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link
            href={catalogHref(path, { ...filters, page: page + 1 })}
            className="border border-ink px-4 py-2 text-[0.72rem] tracking-[0.16em] uppercase"
          >
            Следна
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
