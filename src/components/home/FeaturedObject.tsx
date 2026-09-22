import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { LinkButton } from "@/components/ui/LinkButton";
import { mockFeatured } from "@/content/mock/homepage";
import { formatItemPrice } from "@/lib/catalog/money";
import { itemMetaLine, primaryImage, publicStatusLabel, publicStatusTone } from "@/lib/catalog/present";
import { itemPath } from "@/lib/i18n/routes";
import type { PublicItemDetail } from "@/server/catalog/queries";

export function FeaturedObject({ item }: { item?: PublicItemDetail | null }) {
  const liveImage = item ? primaryImage(item) : null;
  const useLive = Boolean(item && liveImage?.src);

  if (!useLive || !item) {
    return (
      <section className="bg-ivory py-20 md:py-28 lg:py-32">
        <Container width="wide" className="lg:px-12">
          <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Селекција на кураторот</p>
          <div className="mt-12 grid items-end gap-10 md:mt-16 md:grid-cols-12 md:gap-14 lg:gap-16">
            <ImageFrame
              src={mockFeatured.image.src}
              alt={mockFeatured.image.alt}
              className="aspect-[4/5] md:col-span-8 md:aspect-[5/6] md:min-h-[min(78vh,46rem)] md:[&>div]:min-h-[min(78vh,46rem)]"
              sizes="(min-width: 768px) 66vw, 100vw"
            />
            <div className="md:col-span-4 md:pb-8">
              <p className="text-[0.68rem] tracking-[0.2em] uppercase text-muted">Предмет</p>
              <div className="mt-4">
                <Badge>{mockFeatured.status}</Badge>
              </div>
              <h2 className="mt-5 font-serif text-4xl leading-tight md:text-5xl lg:text-[3.25rem]">
                {mockFeatured.title}
              </h2>
              <p className="mt-5 text-[0.72rem] tracking-[0.2em] uppercase text-muted">{mockFeatured.reference}</p>
              <p className="mt-3 text-sm tracking-wide text-muted">
                {mockFeatured.origin} · {mockFeatured.period}
              </p>
              <p className="mt-8 max-w-sm text-[1.05rem] leading-8 text-charcoal/85">{mockFeatured.excerpt}</p>
              <LinkButton href={mockFeatured.href} className="mt-10" variant="secondary">
                Погледни го предметот
              </LinkButton>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  const image = liveImage!;
  const meta = itemMetaLine(item);

  return (
    <section className="bg-ivory py-20 md:py-28 lg:py-32">
      <Container width="wide" className="lg:px-12">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Селекција на кураторот</p>
        <div className="mt-12 grid items-end gap-10 md:mt-16 md:grid-cols-12 md:gap-14 lg:gap-16">
          <ImageFrame
            src={image.src ?? ""}
            alt={image.alt}
            className="aspect-[4/5] md:col-span-8 md:aspect-[5/6] md:min-h-[min(78vh,46rem)] md:[&>div]:min-h-[min(78vh,46rem)]"
            sizes="(min-width: 768px) 66vw, 100vw"
          />
          <div className="md:col-span-4 md:pb-8">
            <p className="text-[0.68rem] tracking-[0.2em] uppercase text-muted">{item.category.name}</p>
            <div className="mt-4">
              <Badge tone={publicStatusTone(item.status)}>{publicStatusLabel(item.status)}</Badge>
            </div>
            <h2 className="mt-5 font-serif text-4xl leading-tight md:text-5xl lg:text-[3.25rem]">{item.title}</h2>
            <p className="mt-5 text-[0.72rem] tracking-[0.2em] uppercase text-muted">{item.referenceNumber}</p>
            {meta ? <p className="mt-3 text-sm tracking-wide text-muted">{meta}</p> : null}
            <p className="mt-8 font-serif text-2xl tracking-tight">{formatItemPrice(item.price, item.currency)}</p>
            {item.shortDescription ? (
              <p className="mt-8 max-w-sm text-[1.05rem] leading-8 text-charcoal/85">{item.shortDescription}</p>
            ) : null}
            <LinkButton href={itemPath(item.slug)} className="mt-10" variant="secondary">
              Погледни го предметот
            </LinkButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
