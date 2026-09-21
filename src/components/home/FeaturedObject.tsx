import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { LinkButton } from "@/components/ui/LinkButton";
import { Section } from "@/components/ui/Section";
import { mockFeatured } from "@/content/mock/homepage";
import { formatItemPrice } from "@/lib/catalog/money";
import { itemMetaLine, primaryImage, publicStatusLabel, publicStatusTone } from "@/lib/catalog/present";
import { itemPath, publicPaths } from "@/lib/i18n/routes";
import type { PublicItemDetail } from "@/server/catalog/queries";

export function FeaturedObject({ item }: { item?: PublicItemDetail | null }) {
  if (!item) {
    return (
      <Section>
        <Container width="wide">
          <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Избран предмет</p>
          <div className="mt-10 grid items-center gap-10 md:mt-14 md:grid-cols-12 md:gap-16">
            <ImageFrame
              src={mockFeatured.image.src}
              alt={mockFeatured.image.alt}
              className="aspect-[4/5] md:col-span-7 md:aspect-[5/6]"
              sizes="(min-width: 768px) 55vw, 100vw"
            />
            <div className="md:col-span-5">
              <Badge>{mockFeatured.status}</Badge>
              <p className="mt-4 text-[0.72rem] tracking-[0.2em] uppercase text-muted">{mockFeatured.reference}</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">{mockFeatured.title}</h2>
              <p className="mt-3 text-sm tracking-wide text-muted">
                {mockFeatured.origin} · {mockFeatured.period}
              </p>
              <p className="mt-8 max-w-sm text-[1.05rem] leading-8 text-charcoal/85">{mockFeatured.excerpt}</p>
              <LinkButton href={publicPaths.collection} className="mt-10" variant="secondary">
                Истражи ја колекцијата
              </LinkButton>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  const image = primaryImage(item);
  const meta = itemMetaLine(item);

  return (
    <Section>
      <Container width="wide">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Избран предмет</p>
        <div className="mt-10 grid items-center gap-10 md:mt-14 md:grid-cols-12 md:gap-16">
          <ImageFrame
            src={image.src ?? ""}
            alt={image.alt}
            className="aspect-[4/5] md:col-span-7 md:aspect-[5/6]"
            sizes="(min-width: 768px) 55vw, 100vw"
          />
          <div className="md:col-span-5">
            <Badge tone={publicStatusTone(item.status)}>{publicStatusLabel(item.status)}</Badge>
            <p className="mt-4 text-[0.72rem] tracking-[0.2em] uppercase text-muted">{item.referenceNumber}</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">{item.title}</h2>
            {meta ? <p className="mt-3 text-sm tracking-wide text-muted">{meta}</p> : null}
            <p className="mt-4 text-sm tracking-wide">{formatItemPrice(item.price, item.currency)}</p>
            {item.shortDescription ? (
              <p className="mt-8 max-w-sm text-[1.05rem] leading-8 text-charcoal/85">{item.shortDescription}</p>
            ) : null}
            <LinkButton href={itemPath(item.slug)} className="mt-10" variant="secondary">
              Погледни го предметот
            </LinkButton>
          </div>
        </div>
      </Container>
    </Section>
  );
}
