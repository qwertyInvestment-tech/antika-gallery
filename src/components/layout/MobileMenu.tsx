"use client";

import Link from "next/link";
import { useEffect } from "react";
import { logoutAction } from "@/server/actions/auth";
import { publicPaths } from "@/lib/i18n/routes";
import { primaryNav } from "@/components/layout/nav";
import type { SessionUser } from "@/lib/auth/session-token";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  user: SessionUser | null;
};

export function MobileMenu({ open, onClose, user }: MobileMenuProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ivory md:hidden" role="dialog" aria-modal="true" aria-label="Мени">
      <div className="flex items-center justify-between border-b border-line px-5 py-5">
        <p className="font-serif text-xl tracking-[0.22em]">ANTIKA</p>
        <button type="button" onClick={onClose} className="text-[0.75rem] tracking-[0.18em] uppercase">
          Затвори
        </button>
      </div>
      <nav className="flex flex-col gap-6 px-5 py-12">
        {primaryNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="font-serif text-4xl leading-none"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto space-y-4 border-t border-line px-5 py-8 text-[0.8rem] tracking-[0.16em] uppercase text-muted">
        <Link href={publicPaths.search} onClick={onClose} className="block">
          Пребарај
        </Link>
        <Link href={publicPaths.favorites} onClick={onClose} className="block">
          Омилени
        </Link>
        {user ? (
          <>
            <Link href={publicPaths.profile} onClick={onClose} className="block">
              Мој профил
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="block uppercase tracking-[0.16em]">
                Одјави се
              </button>
            </form>
          </>
        ) : (
          <Link href={publicPaths.login} onClick={onClose} className="block">
            Корисник
          </Link>
        )}
        <Link href={publicPaths.contact} onClick={onClose} className="block">
          Контакт
        </Link>
      </div>
    </div>
  );
}
