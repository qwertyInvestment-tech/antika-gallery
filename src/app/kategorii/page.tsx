import { CollectionTile } from "@/components/editorial/CollectionTile";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
        <SectionHeading
          eyebrow="Категории"
          title="Простори во колекцијата"
          description="Не оддели во продавница. Простори во кои се собираат предмети од ист карактер."
        />
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
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
