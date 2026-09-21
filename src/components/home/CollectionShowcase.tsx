import { CollectionTile } from "@/components/editorial/CollectionTile";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { categoryVisuals } from "@/content/catalog/category-visuals";
import { mockCategories } from "@/content/mock/homepage";
import { categoryPath } from "@/lib/i18n/routes";

type CategoryRow = { slug: string; name: string };

export function CollectionShowcase({ categories = [] }: { categories?: CategoryRow[] }) {
  const tiles =
    categories.length > 0
      ? categories.map((category) => {
          const visual = categoryVisuals[category.slug];
          return {
            name: category.name,
            href: categoryPath(category.slug),
            image: visual ? { src: visual.src, alt: visual.alt } : null,
            size: visual?.size ?? ("medium" as const),
          };
        })
      : mockCategories;

  return (
    <Section tone="parchment">
      <Container width="wide">
        <SectionHeading
          eyebrow="Разгледај"
          title="Колекцијата"
          description="Не каталог со редови. Простори во кои се собираат предмети од ист карактер."
        />
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          {tiles.map((category) => (
            <CollectionTile
              key={category.href + category.name}
              name={category.name}
              href={category.href}
              image={category.image}
              size={category.size}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
