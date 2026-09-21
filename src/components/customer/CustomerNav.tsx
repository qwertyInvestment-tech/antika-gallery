import Link from "next/link";
import { publicPaths } from "@/lib/i18n/routes";

export function CustomerNav() {
  const links = [
    { href: publicPaths.profile, label: "Профил" },
    { href: publicPaths.favorites, label: "Омилени" },
    { href: publicPaths.myOrders, label: "Нарачки" },
    { href: publicPaths.myReservations, label: "Резервации" },
  ];
  return (
    <nav className="mt-8 flex flex-wrap gap-5 text-[0.72rem] tracking-[0.16em] uppercase text-muted">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="hover:text-ink">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
