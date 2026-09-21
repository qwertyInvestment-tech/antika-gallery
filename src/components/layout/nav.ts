import { publicPaths } from "@/lib/i18n/routes";

export const primaryNav = [
  { href: publicPaths.home, label: "Почетна" },
  { href: publicPaths.collection, label: "Колекција" },
  { href: publicPaths.categories, label: "Категории" },
  { href: publicPaths.stories, label: "Приказни" },
  { href: publicPaths.about, label: "За нас" },
] as const;

export const utilityNav = [
  { href: publicPaths.search, label: "Пребарај" },
  { href: publicPaths.favorites, label: "Омилени" },
  { href: publicPaths.login, label: "Корисник" },
] as const;
