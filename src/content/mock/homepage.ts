import { publicPaths } from "@/lib/i18n/routes";

// MOCK CONTENT — визуелен prototype од Фаза 1.
// Реалниот каталог е во Prisma (`Item`) и `src/server/catalog/queries.ts`.

export const mockFeatured = {
  reference: "ANT-000001",
  title: "Џебен часовник",
  origin: "Швајцарија",
  period: "околу 1950",
  status: "Достапно" as const,
  excerpt:
    "Предмет со зачувана патина и механички механизам. Куќиштето го носи трагот на времето, а бројчаникот останува читлив — тивок сведок на џебови, патувања и дланки што го отворале.",
  image: {
    src: "/mock/pocket.png",
    alt: "Џебен часовник од средината на дваесеттиот век",
  },
  href: publicPaths.collection,
};

export const mockCategories = [
  {
    name: "Часовници",
    slug: "casovnici",
    href: publicPaths.categories,
    image: { src: "/mock/watch.png", alt: "Механички часовник" },
    size: "large" as const,
  },
  {
    name: "Монети и банкноти",
    slug: "moneti-i-banknoti",
    href: publicPaths.categories,
    image: { src: "/mock/coins.png", alt: "Стари монети" },
    size: "medium" as const,
  },
  {
    name: "Уметност",
    slug: "umetnost",
    href: publicPaths.categories,
    image: { src: "/mock/art.png", alt: "Уметничко дело" },
    size: "medium" as const,
  },
  {
    name: "Македонско наследство",
    slug: "makedonsko-nasledstvo",
    href: publicPaths.categories,
    image: { src: "/mock/heritage.png", alt: "Камена архитектура и наследство" },
    size: "wide" as const,
  },
  {
    name: "Керамика и порцелан",
    slug: "keramika-i-porcelan",
    href: publicPaths.categories,
    image: { src: "/mock/ceramic.png", alt: "Керамички сад" },
    size: "small" as const,
  },
  {
    name: "Книги и документи",
    slug: "knigi-i-dokumenti",
    href: publicPaths.categories,
    image: null,
    size: "type" as const,
  },
] as const;

export const mockAcquisitions = [
  {
    title: "Сребрен привезок",
    meta: "Балкан · XIX век",
    status: "Нова аквизиција" as const,
    image: { src: "/mock/jewelry.png", alt: "Сребрен накит" },
    href: publicPaths.collection,
  },
  {
    title: "Порцеланска чинија",
    meta: "Европа · околу 1920",
    status: "Достапно" as const,
    image: { src: "/mock/porcelain.png", alt: "Порцеланска чинија" },
    href: publicPaths.collection,
  },
  {
    title: "Кожна бележница",
    meta: "Виена · 1930-ти",
    status: "Достапно" as const,
    image: { src: "/mock/book.png", alt: "Стара кожна бележница" },
    href: publicPaths.collection,
  },
];

export const mockStories = [
  {
    title: "Како да препознаете стар механички часовник",
    excerpt: "Бројчаникот, механизмот и начинот на кој времето го напушта предметот.",
    image: { src: "/mock/watch-detail.png", alt: "Детал од механички часовник" },
    href: publicPaths.stories,
    featured: true,
  },
  {
    title: "Што ни кажува патината на еден предмет?",
    excerpt: "Патината не е грешка. Таа е запис.",
    image: { src: "/mock/patina.png", alt: "Патина на метална површина" },
    href: publicPaths.stories,
    featured: false,
  },
  {
    title: "Монетите како сведоци на времето",
    excerpt: "Мали предмети што носат имиња, симболи и граници на цели епохи.",
    image: { src: "/mock/coins.png", alt: "Стари монети одблиску" },
    href: publicPaths.stories,
    featured: false,
  },
];

export const mockHeroImage = {
  src: "/mock/hero.png",
  alt: "Галериски простор со уметнички дела на ѕид",
  caption: "Колекцијата се разгледува предмет по предмет.",
};
