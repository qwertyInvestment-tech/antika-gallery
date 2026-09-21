import { ItemStatus } from "@prisma/client";
import { formatItemPrice } from "@/lib/catalog/money";
import { toPublicImageSrc } from "@/lib/catalog/media";
import { itemConditionLabels, itemStatusLabels } from "@/lib/domain/labels";
import { isPurchasableStatus } from "@/lib/domain/item-status";
import { itemPath } from "@/lib/i18n/routes";
import type { PublicCatalogItem, PublicItemDetail } from "@/server/catalog/queries";

export function publicStatusLabel(status: ItemStatus) {
  return itemStatusLabels[status];
}

export function publicStatusTone(status: ItemStatus): "default" | "sold" | "quiet" {
  if (status === ItemStatus.SOLD) return "sold";
  if (status === ItemStatus.RESERVED) return "quiet";
  return "default";
}

export function itemMetaLine(item: { periodLabel?: string | null; origin?: string | null }) {
  return [item.origin, item.periodLabel].filter(Boolean).join(" · ");
}

export function primaryImage(item: Pick<PublicCatalogItem, "images" | "title">) {
  const image =
    item.images.find((row) => ("kind" in row.asset ? row.asset.kind !== "VIDEO" : true)) ?? item.images[0];
  const src = toPublicImageSrc(image?.asset.url);
  return {
    src,
    alt: image?.asset.alt || item.title,
  };
}

export function toPreviewModel(item: PublicCatalogItem) {
  const image = primaryImage(item);
  return {
    id: item.id,
    href: itemPath(item.slug),
    title: item.title,
    meta: itemMetaLine(item),
    status: publicStatusLabel(item.status),
    statusValue: item.status,
    tone: publicStatusTone(item.status),
    price: formatItemPrice(item.price, item.currency),
    reference: item.referenceNumber,
    image,
    retired: item.status === ItemStatus.SOLD,
    reserved: item.status === ItemStatus.RESERVED,
    purchasable: isPurchasableStatus(item.status),
  };
}

export function itemFacts(item: PublicItemDetail) {
  return [
    item.periodLabel ? { label: "Период", value: item.periodLabel } : null,
    item.origin ? { label: "Потекло", value: item.origin } : null,
    item.material ? { label: "Материјал", value: item.material } : null,
    item.maker ? { label: "Производител / автор", value: item.maker } : null,
    item.condition ? { label: "Состојба", value: itemConditionLabels[item.condition] } : null,
    item.conditionNotes ? { label: "Детал за состојбата", value: item.conditionNotes } : null,
    item.dimensions ? { label: "Димензии", value: item.dimensions } : null,
    item.weight ? { label: "Тежина", value: item.weight } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));
}
