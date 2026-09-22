import { notFound } from "next/navigation";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { toPreviewModel } from "@/lib/catalog/present";
import { parsePublicCatalogParams } from "@/lib/catalog/public-query";
import { categoryPath, publicPaths } from "@/lib/i18n/routes";
import { getPublicCategoryBySlug, searchPublicCatalog } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(decodeURIComponent(slug));
  if (!category) return { title: "Категоријата не е пронајдена — ANTIKA" };
  return {
    title: `${category.name} — ANTIKA`,
    description: category.description ?? `Предмети од ${category.name} во колекцијата на ANTIKA.`,
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const category = await getPublicCategoryBySlug(decoded);
  if (!category) notFound();

  const filters = parsePublicCatalogParams({
    ...(await searchParams),
    категорија: decoded,
  });
  const result = await searchPublicCatalog(filters);

  return (
    <SiteShell>
      <Container width="wide" className="py-16 md:py-24">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Категорија</p>
        <h1 className="mt-5 font-serif text-5xl leading-tight md:text-6xl">{category.name}</h1>
        {category.description ? (
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">{category.description}</p>
        ) : null}
        <p className="mt-5 text-sm text-muted">
          {result.total === 0 ? "Нема јавни предмети" : result.total === 1 ? "Еден предмет" : `${result.total} предмети`}
        </p>
        <LinkButton href={publicPaths.collection} variant="ghost" className="mt-6 px-0">
          Целата колекција
        </LinkButton>

        <div className="mt-16">
          {result.items.length === 0 ? (
            <CatalogEmpty title="Во оваа категорија моментално нема предмети." />
          ) : (
            <CatalogGrid items={result.items.map(toPreviewModel)} />
          )}
        </div>

        <CatalogPagination
          path={categoryPath(category.slug)}
          filters={filters}
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
        />
      </Container>
    </SiteShell>
  );
}
