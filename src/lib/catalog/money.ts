import { Prisma } from "@prisma/client";
import { currencyLabels } from "@/lib/domain/labels";

export function formatItemPrice(price: Prisma.Decimal | string, currency: string) {
  const decimal = typeof price === "string" ? new Prisma.Decimal(price) : price;
  const amount = decimal.toFixed(2);
  const [whole, fraction] = amount.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const display = fraction === "00" ? grouped : `${grouped},${fraction}`;
  const label = currencyLabels[currency as keyof typeof currencyLabels] ?? currency;
  return `${display} ${label}`;
}

export function pricePlain(price: Prisma.Decimal | string) {
  const decimal = typeof price === "string" ? new Prisma.Decimal(price) : price;
  return decimal.toFixed(2);
}
