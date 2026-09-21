import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { CategoryNav } from "@/components/catalog/CategoryNav";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { toPreviewModel } from "@/lib/catalog/present";
import { parsePublicCatalogParams } from "@/lib/catalog/public-query";
import { publicPaths } from "@/lib/i18n/routes";
import { getPublicCategories, searchPublicCatalog } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Колекција — ANTIKA",
  description: "Избрани антиквитети и колекционерски предмети. Секој предмет е еден конкретен примерок.",
};

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parsePublicCatalogParams(params);
  const [categories, result] = await Promise.all([
    getPublicCategories(),
    searchPublicCatalog(filters),
  ]);

  return (
    <SiteShell>
      <Container width="wide" className="py-16 md:py-24">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Колекција</p>
        <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[0.95] md:text-6xl">Предмети, не залиха.</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
          Секој запис е еден конкретен физички предмет. Разгледувајте ги како галерија — бавно, со простор околу фотографијата.
        </p>

        <div className="mt-12">
          <CategoryNav categories={categories} activeSlug={filters.categorySlug} />
        </div>
        <div className="mt-8">
          <CatalogFilters action={publicPaths.collection} categories={categories} filters={filters} />
        </div>

        <div className="mt-14">
          {result.items.length === 0 ? (
            <CatalogEmpty
              title={filters.q ? "Нема предмети што одговараат на пребарувањето." : "Во оваа збирка моментално нема предмети."}
            />
          ) : (
            <CatalogGrid items={result.items.map(toPreviewModel)} />
          )}
        </div>

        <CatalogPagination
          path={publicPaths.collection}
          filters={filters}
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
        />
      </Container>
    </SiteShell>
  );
}
