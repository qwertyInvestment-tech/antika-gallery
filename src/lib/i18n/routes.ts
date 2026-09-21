export const publicPaths = {
  home: "/",
  collection: "/колекција",
  categories: "/категории",
  stories: "/приказни",
  about: "/за-нас",
  contact: "/контакт",
  search: "/пребарај",
  favorites: "/омилени",
  requestItem: "/побарај-предмет",
  login: "/најава",
  register: "/регистрација",
  profile: "/мој-профил",
  myOrders: "/моите-нарачки",
  myReservations: "/моите-резервации",
  cart: "/кошничка",
  legalTerms: "/услови-за-користење",
  legalPrivacy: "/политика-за-приватност",
  legalCookies: "/политика-за-колачиња",
  admin: "/admin",
} as const;

export function itemPath(slug: string) {
  return `/предмет/${slug}`;
}

export function categoryPath(slug: string) {
  return `/категории/${slug}`;
}

export function customerOrderPath(id: string) {
  return `/моите-нарачки/${id}`;
}

export const routeRewrites = [
  { source: "/најава", destination: "/prijava" },
  { source: "/регистрација", destination: "/registracija" },
  { source: "/мој-профил", destination: "/moj-profil" },
  { source: "/моите-нарачки", destination: "/moite-naracki" },
  { source: "/моите-резервации", destination: "/moite-rezervacii" },
  { source: "/колекција", destination: "/kolekcija" },
  { source: "/категории", destination: "/kategorii" },
  { source: "/категории/:slug", destination: "/kategorii/:slug" },
  { source: "/предмет/:slug", destination: "/predmet/:slug" },
  { source: "/приказни", destination: "/prikazni" },
  { source: "/за-нас", destination: "/za-nas" },
  { source: "/контакт", destination: "/kontakt" },
  { source: "/пребарај", destination: "/prebaraj" },
  { source: "/омилени", destination: "/omileni" },
  { source: "/побарај-предмет", destination: "/pobaraj-predmet" },
  { source: "/кошничка", destination: "/kosnicka" },
  { source: "/услови-за-користење", destination: "/uslovi" },
  { source: "/политика-за-приватност", destination: "/privatnost" },
  { source: "/политика-за-колачиња", destination: "/kolacinja" },
  { source: "/моите-нарачки/:id", destination: "/moite-naracki/:id" },
] as const;
