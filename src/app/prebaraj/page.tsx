import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { toPreviewModel } from "@/lib/catalog/present";
import { parsePublicCatalogParams } from "@/lib/catalog/public-query";
import { publicPaths } from "@/lib/i18n/routes";
import { getPublicCategories, searchPublicCatalog } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Пребарај — ANTIKA",
  description: "Пребарајте ја колекцијата по назив, референца, автор, потекло или период.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parsePublicCatalogParams(params);
  const [categories, result] = await Promise.all([
    getPublicCategories(),
    filters.q ? searchPublicCatalog(filters) : Promise.resolve(null),
  ]);

  return (
    <SiteShell>
      <Container width="wide" className="py-16 md:py-24">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Пребарај</p>
        <h1 className="mt-4 font-serif text-5xl">Најдете еден предмет.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
          Пребарувањето се извршува на серверот — по назив, референтен број, автор, потекло и период.
        </p>
        <div className="mt-10">
          <CatalogFilters action={publicPaths.search} categories={categories} filters={filters} showExtended={false} />
        </div>
        <div className="mt-14">
          {!filters.q ? (
            <p className="text-muted">Внесете назив или ANT-референца.</p>
          ) : result && result.items.length === 0 ? (
            <CatalogEmpty title="Нема предмети што одговараат на пребарувањето." />
          ) : result ? (
            <CatalogGrid items={result.items.map(toPreviewModel)} />
          ) : null}
        </div>
        {result ? (
          <CatalogPagination
            path={publicPaths.search}
            filters={filters}
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
          />
        ) : null}
      </Container>
    </SiteShell>
  );
}
