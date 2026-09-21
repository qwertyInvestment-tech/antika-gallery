"use client";

import Link from "next/link";
import { useState } from "react";
import { logoutAction } from "@/server/actions/auth";
import { publicPaths } from "@/lib/i18n/routes";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { primaryNav } from "@/components/layout/nav";
import type { SessionUser } from "@/lib/auth/session-token";

export function Header({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ivory/90 backdrop-blur-[2px]">
      <div className="mx-auto grid h-[4.25rem] w-full max-w-[88rem] grid-cols-3 items-center px-5 sm:px-8">
        <Link href={publicPaths.home} className="justify-self-start font-serif text-[1.35rem] tracking-[0.28em]">
          ANTIKA
        </Link>

        <nav className="hidden justify-self-center md:block" aria-label="Главно мени">
          <ul className="flex items-center gap-7 text-[0.72rem] tracking-[0.18em] uppercase">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink/80 transition-colors duration-300 hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-self-end gap-4 text-[0.72rem] tracking-[0.16em] uppercase">
          <Link href={publicPaths.search} className="hidden sm:inline hover:text-walnut" aria-label="Пребарај">
            Пребарај
          </Link>
          <Link href={publicPaths.favorites} className="hidden lg:inline hover:text-walnut">
            Омилени
          </Link>
          {user ? (
            <>
              <Link href={publicPaths.profile} className="hidden lg:inline hover:text-walnut">
                Мој профил
              </Link>
              <form action={logoutAction} className="hidden lg:inline">
                <button type="submit" className="hover:text-walnut">
                  Одјави се
                </button>
              </form>
            </>
          ) : (
            <Link href={publicPaths.login} className="hidden lg:inline hover:text-walnut">
              Корисник
            </Link>
          )}
          <Link href={publicPaths.search} className="sm:hidden" aria-label="Пребарај">
            Пребарај
          </Link>
          <button type="button" className="md:hidden" onClick={() => setOpen(true)} aria-expanded={open}>
            Мени
          </button>
        </div>
      </div>
      <MobileMenu open={open} onClose={() => setOpen(false)} user={user} />
    </header>
  );
}
