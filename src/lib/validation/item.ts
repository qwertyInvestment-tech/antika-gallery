import { ItemCondition, ItemStatus } from "@prisma/client";
import { z } from "zod";
import { slugSchema } from "@/lib/validation/common";

export const itemStatusSchema = z.nativeEnum(ItemStatus);
export const itemConditionSchema = z.nativeEnum(ItemCondition);
export const currencySchema = z.enum(["MKD", "EUR"]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value === "" ? null : value));

export const itemWriteSchema = z.object({
  title: z.string().trim().min(2, "Насловот е задолжителен.").max(200),
  slug: slugSchema.optional().or(z.literal("")),
  categoryId: z.string().uuid("Изберете категорија."),
  shortDescription: optionalText(400),
  description: optionalText(20000),
  price: z
    .string()
    .trim()
    .regex(/^\d+([.,]\d{1,2})?$/, "Внесете валидна цена.")
    .transform((value) => value.replace(",", ".")),
  currency: currencySchema.default("MKD"),
  status: itemStatusSchema.default(ItemStatus.DRAFT),
  periodLabel: optionalText(120),
  origin: optionalText(160),
  maker: optionalText(160),
  provenance: optionalText(4000),
  material: optionalText(160),
  condition: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    itemConditionSchema.optional().nullable(),
  ),
  conditionNotes: optionalText(2000),
  dimensions: optionalText(160),
  weight: optionalText(80),
  authenticityNotes: optionalText(4000),
  documentationNotes: optionalText(4000),
  expertNotes: optionalText(4000),
  certificateNotes: optionalText(4000),
  seoTitle: optionalText(70),
  seoDescription: optionalText(180),
});

export type ItemWriteInput = z.infer<typeof itemWriteSchema>;

export const ADMIN_ITEM_PAGE_SIZE = 20;

export const itemListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  status: itemStatusSchema.optional(),
  sort: z.enum(["createdAt", "title", "price", "referenceNumber"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
});

export type ItemListQuery = z.infer<typeof itemListQuerySchema>;

const PUBLIC_STATUSES: ItemStatus[] = [
  ItemStatus.PUBLISHED,
  ItemStatus.AVAILABLE,
  ItemStatus.RESERVED,
];

export function assertPublishable(input: {
  title: string;
  slug: string;
  categoryId: string;
  price: string;
  currency: string;
  shortDescription?: string | null;
  status: ItemStatus;
}) {
  if (!PUBLIC_STATUSES.includes(input.status) && input.status !== ItemStatus.SOLD) {
    return;
  }

  if (!input.slug) {
    throw new Error("Објавениот предмет мора да има slug.");
  }
  if (!input.shortDescription) {
    throw new Error("Објавениот предмет мора да има краток опис.");
  }
}
