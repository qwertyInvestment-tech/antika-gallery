import { CollectionTile } from "@/components/editorial/CollectionTile";
import { Container } from "@/components/ui/Container";
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
    <section className="bg-walnut-deep py-24 text-ivory-soft md:min-h-[min(85vh,52rem)] md:py-32 lg:py-36">
      <Container width="wide" className="lg:px-12">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-ivory-soft/45">Колекција</p>
        <h2 className="mt-6 max-w-3xl font-serif text-[clamp(2.75rem,6vw,5.5rem)] font-medium leading-[0.94]">
          Избрани предмети.
        </h2>
        <p className="mt-8 max-w-lg text-[1.05rem] leading-8 text-ivory-soft/60">
          Не каталог со редови. Простори во кои се собираат предмети од ист карактер.
        </p>
        <div className="mt-16 grid grid-cols-1 gap-4 md:mt-20 md:grid-cols-12 md:gap-5">
          {tiles.map((category) => (
            <CollectionTile
              key={category.href + category.name}
              name={category.name}
              href={category.href}
              image={category.image}
              size={category.size}
              invert
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
