import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { publicPaths } from "@/lib/i18n/routes";

const navLinks = [
  { href: publicPaths.collection, label: "Колекција" },
  { href: publicPaths.categories, label: "Категории" },
  { href: publicPaths.stories, label: "Приказни" },
  { href: publicPaths.about, label: "За нас" },
  { href: publicPaths.requestItem, label: "Побарај предмет" },
  { href: publicPaths.contact, label: "Контакт" },
];

const legalLinks = [
  { href: publicPaths.legalPrivacy, label: "Политика за приватност" },
  { href: publicPaths.legalTerms, label: "Услови за користење" },
  { href: publicPaths.legalCookies, label: "Политика за колачиња" },
];

export function Footer() {
  return (
    <footer className="bg-[#140f0c] text-ivory-soft">
      <Container width="wide" className="py-24 md:py-32 lg:px-12 lg:py-40">
        <p className="font-serif text-[clamp(3.5rem,12vw,9rem)] leading-none tracking-[0.18em]">ANTIKA</p>
        <p className="mt-8 max-w-xl font-serif text-2xl leading-snug text-ivory-soft/85 md:text-3xl">
          Предмети со историја.
        </p>
        <p className="mt-6 max-w-md text-[0.95rem] leading-8 text-ivory-soft/50">
          Колекција за оние што гледаат подалеку од секојдневното.
        </p>

        <div className="mt-20 grid gap-14 border-t border-ivory-soft/12 pt-16 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <p className="text-[0.68rem] tracking-[0.22em] uppercase text-ivory-soft/40">Навигација</p>
            <ul className="mt-6 space-y-3.5 text-[0.95rem]">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ivory-soft/75 transition-opacity duration-300 hover:opacity-100">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[0.68rem] tracking-[0.22em] uppercase text-ivory-soft/40">Галерија</p>
            <ul className="mt-6 space-y-3.5 text-[0.95rem] text-ivory-soft/75">
              <li>
                <Link href={publicPaths.search} className="transition-opacity duration-300 hover:opacity-100">
                  Пребарај
                </Link>
              </li>
              <li>
                <Link href={publicPaths.favorites} className="transition-opacity duration-300 hover:opacity-100">
                  Омилени
                </Link>
              </li>
              <li>
                <Link href={publicPaths.login} className="transition-opacity duration-300 hover:opacity-100">
                  Корисник
                </Link>
              </li>
              <li>
                <Link href={publicPaths.contact} className="transition-opacity duration-300 hover:opacity-100">
                  Контакт
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[0.68rem] tracking-[0.22em] uppercase text-ivory-soft/40">Правни</p>
            <ul className="mt-6 space-y-3.5 text-sm text-ivory-soft/55">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-opacity duration-300 hover:opacity-100">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      <div className="border-t border-ivory-soft/10">
        <Container
          width="wide"
          className="flex flex-col gap-3 py-8 text-[0.68rem] tracking-[0.14em] uppercase text-ivory-soft/40 sm:flex-row sm:items-center sm:justify-between lg:px-12"
        >
          <p>© ANTIKA</p>
          <p className="normal-case tracking-normal">Дигитална колекција</p>
        </Container>
      </div>
    </footer>
  );
}
