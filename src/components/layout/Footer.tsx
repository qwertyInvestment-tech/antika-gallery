import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { publicPaths } from "@/lib/i18n/routes";

const columns = [
  {
    title: "Колекција",
    links: [
      { href: publicPaths.collection, label: "Колекција" },
      { href: publicPaths.categories, label: "Категории" },
      { href: publicPaths.requestItem, label: "Побарај предмет" },
    ],
  },
  {
    title: "ANTIKA",
    links: [
      { href: publicPaths.stories, label: "Приказни" },
      { href: publicPaths.about, label: "За нас" },
      { href: publicPaths.contact, label: "Контакт" },
    ],
  },
  {
    title: "Правни информации",
    links: [
      { href: publicPaths.legalTerms, label: "Услови за користење" },
      { href: publicPaths.legalPrivacy, label: "Политика за приватност" },
      { href: publicPaths.legalCookies, label: "Политика за колачиња" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-ivory-soft">
      <Container width="wide" className="grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <p className="font-serif text-2xl tracking-[0.28em]">ANTIKA</p>
          <p className="mt-5 max-w-xs text-sm leading-7 text-muted">Предмети со историја.</p>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="md:col-span-2 md:col-start-auto">
            <p className="text-[0.68rem] tracking-[0.22em] uppercase text-muted">{column.title}</p>
            <ul className="mt-5 space-y-3 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-opacity duration-300 hover:opacity-60">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-line">
        <Container width="wide" className="flex flex-col gap-2 py-5 text-[0.7rem] tracking-[0.12em] uppercase text-muted sm:flex-row sm:justify-between">
          <p>ANTIKA</p>
          <p>Дигитална колекција</p>
        </Container>
      </div>
    </footer>
  );
}
