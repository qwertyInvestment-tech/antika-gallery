import { ItemStatus } from "@prisma/client";
import { env } from "@/lib/env";
import { pricePlain } from "@/lib/catalog/money";
import { toPublicImageSrc } from "@/lib/catalog/media";
import { itemPath } from "@/lib/i18n/routes";
import type { PublicItemDetail } from "@/server/catalog/queries";

function availability(status: ItemStatus) {
  if (status === ItemStatus.AVAILABLE) return "https://schema.org/InStock";
  if (status === ItemStatus.RESERVED) return "https://schema.org/LimitedAvailability";
  if (status === ItemStatus.SOLD) return "https://schema.org/SoldOut";
  return null;
}

export function itemJsonLd(item: PublicItemDetail) {
  const url = new URL(itemPath(item.slug), env.APP_URL).toString();
  const images = item.images
    .filter((image) => image.asset.kind !== "VIDEO")
    .map((image) => toPublicImageSrc(image.asset.url))
    .filter((src): src is string => Boolean(src))
    .map((src) => new URL(src, env.APP_URL).toString());

  const offerAvailability = availability(item.status);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.title,
    sku: item.referenceNumber,
    url,
    description: item.seoDescription || item.shortDescription || item.description || undefined,
    image: images.length ? images : undefined,
    category: item.category.name,
  };

  if (offerAvailability) {
    data.offers = {
      "@type": "Offer",
      url,
      price: pricePlain(item.price),
      priceCurrency: item.currency,
      availability: offerAvailability,
    };
  }

  return data;
}
