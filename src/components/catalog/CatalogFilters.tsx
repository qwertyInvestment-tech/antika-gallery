import { ItemStatus } from "@prisma/client";
import { itemStatusLabels } from "@/lib/domain/labels";
import type { PublicCatalogFilters } from "@/lib/catalog/public-query";
import { PUBLIC_FILTER_STATUSES } from "@/lib/catalog/public-query";

type CategoryOption = { slug: string; name: string };

export function CatalogFilters({
  action,
  categories,
  filters,
  showExtended = true,
}: {
  action: string;
  categories: CategoryOption[];
  filters: PublicCatalogFilters;
  showExtended?: boolean;
}) {
  return (
    <form action={action} method="get" className="border-y border-line py-6">
      <div className="grid gap-4 md:grid-cols-12">
        <label className="block text-sm md:col-span-4">
          <span className="text-[0.68rem] tracking-[0.18em] uppercase text-muted">Пребарај</span>
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Назив, ANT-000001, автор…"
            className="mt-2 w-full border border-ink/15 bg-ivory-soft px-3 py-2.5"
          />
        </label>
        <label className="block text-sm md:col-span-3">
          <span className="text-[0.68rem] tracking-[0.18em] uppercase text-muted">Категорија</span>
          <select
            name="категорија"
            defaultValue={filters.categorySlug ?? ""}
            className="mt-2 w-full border border-ink/15 bg-ivory-soft px-3 py-2.5"
          >
            <option value="">Сите</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="text-[0.68rem] tracking-[0.18em] uppercase text-muted">Статус</span>
          <select
            name="статус"
            defaultValue={filters.status ?? ""}
            className="mt-2 w-full border border-ink/15 bg-ivory-soft px-3 py-2.5"
          >
            <option value="">Сите видливи</option>
            {PUBLIC_FILTER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {itemStatusLabels[status as ItemStatus]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm md:col-span-3">
          <span className="text-[0.68rem] tracking-[0.18em] uppercase text-muted">Редослед</span>
          <select
            name="сортирај"
            defaultValue={filters.sort}
            className="mt-2 w-full border border-ink/15 bg-ivory-soft px-3 py-2.5"
          >
            <option value="newest">Најнови</option>
            <option value="price-asc">Цена — растечки</option>
            <option value="price-desc">Цена — опаѓачки</option>
          </select>
        </label>
      </div>

      <details className="mt-4 md:mt-5">
        <summary className="cursor-pointer text-[0.72rem] tracking-[0.16em] uppercase text-muted">
          Цена и дополнителни филтри
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-sm">
            <span className="text-[0.68rem] tracking-[0.18em] uppercase text-muted">Цена од</span>
            <input name="цена-од" defaultValue={filters.minPrice ?? ""} inputMode="decimal" className="mt-2 w-full border border-ink/15 bg-ivory-soft px-3 py-2.5" />
          </label>
          <label className="block text-sm">
            <span className="text-[0.68rem] tracking-[0.18em] uppercase text-muted">Цена до</span>
            <input name="цена-до" defaultValue={filters.maxPrice ?? ""} inputMode="decimal" className="mt-2 w-full border border-ink/15 bg-ivory-soft px-3 py-2.5" />
          </label>
          {showExtended ? (
            <>
              <label className="block text-sm">
                <span className="text-[0.68rem] tracking-[0.18em] uppercase text-muted">Период</span>
                <input name="период" defaultValue={filters.period ?? ""} className="mt-2 w-full border border-ink/15 bg-ivory-soft px-3 py-2.5" />
              </label>
              <label className="block text-sm">
                <span className="text-[0.68rem] tracking-[0.18em] uppercase text-muted">Потекло</span>
                <input name="потекло" defaultValue={filters.origin ?? ""} className="mt-2 w-full border border-ink/15 bg-ivory-soft px-3 py-2.5" />
              </label>
              <label className="block text-sm">
                <span className="text-[0.68rem] tracking-[0.18em] uppercase text-muted">Материјал</span>
                <input name="материјал" defaultValue={filters.material ?? ""} className="mt-2 w-full border border-ink/15 bg-ivory-soft px-3 py-2.5" />
              </label>
            </>
          ) : null}
        </div>
      </details>

      <button type="submit" className="mt-5 border border-ink px-5 py-2.5 text-[0.72rem] tracking-[0.16em] uppercase">
        Прикажи
      </button>
    </form>
  );
}
