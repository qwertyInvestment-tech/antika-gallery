import { ItemCondition, ItemStatus } from "@prisma/client";

export const itemStatusLabels: Record<ItemStatus, string> = {
  DRAFT: "Нацрт",
  PUBLISHED: "Објавено",
  AVAILABLE: "Достапно",
  RESERVED: "Резервирано",
  SOLD: "Продадено",
  ARCHIVED: "Архивирано",
};

export const itemConditionLabels: Record<ItemCondition, string> = {
  NEW_UNUSED: "Ново / некористено",
  EXCELLENT: "Одлична состојба",
  VERY_GOOD: "Многу добра состојба",
  GOOD: "Добра состојба",
  USED: "Со знаци на употреба",
  RESTORATION: "За реставрација",
};

export const currencyLabels = {
  MKD: "МКД",
  EUR: "EUR",
} as const;
