import { CollectionTile } from "@/components/editorial/CollectionTile";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { categoryVisuals } from "@/content/catalog/category-visuals";
import { categoryPath } from "@/lib/i18n/routes";
import { getPublicCategories } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Категории — ANTIKA",
  description: "Простори во колекцијата: часовници, монети, уметност и наследство.",
};

export default async function CategoriesPage() {
  const categories = await getPublicCategories();

  return (
    <SiteShell>
      <Container width="wide" className="py-16 md:py-24">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Категории</p>
        <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2.75rem,6vw,5.5rem)] font-medium leading-[0.94]">
          Простори во колекцијата
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-muted">
          Не оддели во продавница. Простори во кои се собираат предмети од ист карактер.
        </p>
        <div className="mt-16 grid grid-cols-1 gap-5 md:mt-20 md:grid-cols-12 md:gap-5">
          {categories.map((category) => {
            const visual = categoryVisuals[category.slug];
            return (
              <CollectionTile
                key={category.slug}
                name={category.name}
                href={categoryPath(category.slug)}
                image={visual ? { src: visual.src, alt: visual.alt } : null}
                size={visual?.size ?? "medium"}
              />
            );
          })}
        </div>
      </Container>
    </SiteShell>
  );
}
