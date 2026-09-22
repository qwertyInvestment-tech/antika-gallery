import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { ItemStatus } from "@prisma/client";
import { ItemGallery } from "@/components/catalog/ItemGallery";
import { FavoriteButton } from "@/components/customer/FavoriteButton";
import { ItemInquiryForm } from "@/components/customer/ItemInquiryForm";
import { SiteShell } from "@/components/layout/SiteShell";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { env } from "@/lib/env";
import { formatItemPrice } from "@/lib/catalog/money";
import { toPublicImageSrc } from "@/lib/catalog/media";
import { itemFacts, itemMetaLine, publicStatusLabel, publicStatusTone } from "@/lib/catalog/present";
import { itemJsonLd } from "@/lib/catalog/structured-data";
import { isPurchasableStatus } from "@/lib/domain/item-status";
import { categoryPath, itemPath } from "@/lib/i18n/routes";
import { getItemBySlug } from "@/server/catalog/queries";
import { getSessionUser } from "@/lib/auth/session";
import { listFavoriteIds } from "@/server/services/favorite-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItemBySlug(decodeURIComponent(slug));
  if (!item) {
    return { title: "Предметот не е пронајден — ANTIKA" };
  }

  const title = item.seoTitle || `${item.title} — ANTIKA`;
  const description = item.seoDescription || item.shortDescription || `Предмет ${item.referenceNumber} во колекцијата на ANTIKA.`;
  const primaryAsset =
    item.images.find((row) => row.isPrimary && row.asset.kind !== "VIDEO") ??
    item.images.find((row) => row.asset.kind !== "VIDEO") ??
    item.images[0];
  const image = toPublicImageSrc(primaryAsset?.asset.url);
  const canonical = new URL(itemPath(item.slug), env.APP_URL).toString();

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: image ? [{ url: new URL(image, env.APP_URL).toString(), alt: item.title }] : undefined,
    },
  };
}

export default async function ItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getItemBySlug(decodeURIComponent(slug));
  if (!item) notFound();
  const session = await getSessionUser();
  const favoriteIds = session ? await listFavoriteIds(session.id) : [];

  const galleryImages = item.images
    .filter((image) => image.asset.kind !== "VIDEO")
    .map((image) => ({
      src: toPublicImageSrc(image.asset.url) ?? "",
      alt: image.asset.alt || item.title,
    }))
    .filter((image) => image.src);
  const videos = item.images
    .filter((image) => image.asset.kind === "VIDEO")
    .map((image) => ({
      src: toPublicImageSrc(image.asset.url) ?? "",
      title: image.asset.alt || item.title,
    }))
    .filter((video) => video.src);
  const facts = itemFacts(item);
  const history = item.description;
  const papers = [item.provenance, item.authenticityNotes, item.documentationNotes, item.certificateNotes, item.expertNotes]
    .filter(Boolean)
    .join("\n\n");

  return (
    <SiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemJsonLd(item)) }} />
      <Container width="wide" className="py-12 md:py-16 lg:py-20">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-7 xl:col-span-8">
            <ItemGallery images={galleryImages} title={item.title} />
            {videos.length > 0 ? (
              <section className="mt-8 space-y-4">
                <h2 className="font-serif text-2xl">Видео</h2>
                {videos.map((video) => (
                  <video
                    key={video.src}
                    src={video.src}
                    controls
                    preload="metadata"
                    playsInline
                    className="w-full border border-line bg-ink/5"
                    aria-label={video.title}
                  />
                ))}
              </section>
            ) : null}
          </div>
          <div className="lg:col-span-5 lg:sticky lg:top-32 xl:col-span-4">
            <NextLink
              href={categoryPath(item.category.slug)}
              className="text-[0.68rem] tracking-[0.2em] uppercase text-muted transition-opacity duration-300 hover:opacity-70"
            >
              {item.category.name}
            </NextLink>
            <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">{item.title}</h1>
            <p className="mt-5 text-[0.72rem] tracking-[0.22em] uppercase text-muted">{item.referenceNumber}</p>
            <div className="mt-4">
              <Badge tone={publicStatusTone(item.status)}>{publicStatusLabel(item.status)}</Badge>
            </div>
            <p className="mt-7 font-serif text-3xl tracking-tight">{formatItemPrice(item.price, item.currency)}</p>
            {itemMetaLine(item) ? <p className="mt-3 text-sm tracking-wide text-muted">{itemMetaLine(item)}</p> : null}
            {item.shortDescription ? (
              <p className="mt-8 text-[1.05rem] leading-8 text-charcoal/85">{item.shortDescription}</p>
            ) : null}

            {item.status === ItemStatus.SOLD ? (
              <p className="mt-10 border-y border-line py-5 text-[0.72rem] tracking-[0.18em] uppercase text-muted">
                Продадено — архивски предмет во колекцијата.
              </p>
            ) : null}
            {item.status === ItemStatus.RESERVED ? (
              <p className="mt-10 border-y border-line py-5 text-[0.72rem] tracking-[0.18em] uppercase text-muted">
                Резервирано — предметот моментално не е достапен.
              </p>
            ) : null}
            {isPurchasableStatus(item.status) ? (
              <ItemInquiryForm
                itemId={item.id}
                title={item.title}
                reference={item.referenceNumber}
                identity={
                  session
                    ? { name: session.name, email: session.email }
                    : null
                }
              />
            ) : null}

            <FavoriteButton
              item={{ id: item.id, slug: item.slug, reference: item.referenceNumber }}
              authenticated={Boolean(session)}
              initiallySaved={favoriteIds.includes(item.id)}
            />
          </div>
        </div>

        {facts.length > 0 ? (
          <section className="mt-20 border-t border-line pt-14 md:mt-28">
            <h2 className="font-serif text-3xl">Карактеристики</h2>
            <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className="border-t border-line pt-4">
                  <dt className="text-[0.68rem] tracking-[0.18em] uppercase text-muted">{fact.label}</dt>
                  <dd className="mt-2 text-base leading-7">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {history ? (
          <section className="mt-16 max-w-3xl">
            <h2 className="font-serif text-3xl">Историја на предметот</h2>
            <p className="mt-6 whitespace-pre-line text-[1.05rem] leading-8 text-charcoal/85">{history}</p>
          </section>
        ) : null}

        {papers ? (
          <section className="mt-16 max-w-3xl">
            <h2 className="font-serif text-3xl">Провениенција и документација</h2>
            <p className="mt-6 whitespace-pre-line text-[1.05rem] leading-8 text-charcoal/85">{papers}</p>
          </section>
        ) : null}
      </Container>
    </SiteShell>
  );
}
