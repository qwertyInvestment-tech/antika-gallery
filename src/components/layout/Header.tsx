"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/server/actions/auth";
import { publicPaths } from "@/lib/i18n/routes";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { primaryNav } from "@/components/layout/nav";
import type { SessionUser } from "@/lib/auth/session-token";

function navCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname() || "/";
  const overlayHome = pathname === "/";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 28);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !overlayHome || scrolled;
  const light = overlayHome && !scrolled;

  return (
    <header
      data-site-header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter,color] duration-300 ${
        solid
          ? "border-b border-line/60 bg-ivory/96 text-ink backdrop-blur-[4px]"
          : "border-b border-transparent bg-transparent text-ivory-soft"
      }`}
    >
      <div className="mx-auto flex h-[4.75rem] w-full max-w-[92rem] items-center justify-between gap-6 px-5 sm:px-8 lg:h-[5.5rem] lg:px-12">
        <Link
          href={publicPaths.home}
          className="shrink-0 font-serif text-[1.45rem] tracking-[0.32em] transition-opacity duration-300 hover:opacity-70"
        >
          ANTIKA
        </Link>

        <nav className="hidden flex-1 justify-center lg:flex" aria-label="Главно мени">
          <ul className="flex items-center gap-9 text-[0.68rem] tracking-[0.22em] uppercase xl:gap-11">
            {primaryNav.map((item) => {
              const current = navCurrent(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      light
                        ? `relative transition-opacity duration-300 hover:opacity-100 ${current ? "opacity-100" : "opacity-70"}`
                        : "antika-nav-link"
                    }
                    aria-current={current ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1 text-[0.68rem] tracking-[0.16em] uppercase sm:gap-2">
          <Link
            href={publicPaths.search}
            className="hidden min-h-11 items-center px-2.5 transition-opacity duration-300 hover:opacity-70 md:inline-flex"
            aria-label="Пребарај"
          >
            Пребарај
          </Link>
          <Link
            href={publicPaths.favorites}
            className="hidden min-h-11 items-center px-2.5 transition-opacity duration-300 hover:opacity-70 md:inline-flex"
          >
            Омилени
          </Link>
          {user ? (
            <>
              <Link
                href={publicPaths.profile}
                className="hidden min-h-11 items-center px-2.5 transition-opacity duration-300 hover:opacity-70 xl:inline-flex"
              >
                Мој профил
              </Link>
              <form action={logoutAction} className="hidden xl:inline">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center px-2.5 transition-opacity duration-300 hover:opacity-70"
                >
                  Одјави се
                </button>
              </form>
            </>
          ) : (
            <Link
              href={publicPaths.login}
              className="hidden min-h-11 items-center px-2.5 transition-opacity duration-300 hover:opacity-70 xl:inline-flex"
            >
              Корисник
            </Link>
          )}
          <Link
            href={publicPaths.search}
            className="inline-flex min-h-11 min-w-11 items-center justify-center md:hidden"
            aria-label="Пребарај"
          >
            Пребарај
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center lg:hidden"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-label="Отвори мени"
          >
            Мени
          </button>
        </div>
      </div>
      <MobileMenu open={open} onClose={() => setOpen(false)} user={user} />
    </header>
  );
}
