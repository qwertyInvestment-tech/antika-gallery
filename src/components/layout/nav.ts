import { publicPaths } from "@/lib/i18n/routes";

/** Primary gallery navigation — no home link (logo covers that). */
export const primaryNav = [
  { href: publicPaths.collection, label: "Колекција" },
  { href: publicPaths.categories, label: "Категории" },
  { href: publicPaths.stories, label: "Приказни" },
  { href: publicPaths.about, label: "За нас" },
  { href: publicPaths.contact, label: "Контакт" },
] as const;

export const utilityNav = [
  { href: publicPaths.search, label: "Пребарај" },
  { href: publicPaths.favorites, label: "Омилени" },
  { href: publicPaths.login, label: "Корисник" },
] as const;
