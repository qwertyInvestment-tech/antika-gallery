"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { logoutAction } from "@/server/actions/auth";
import { publicPaths } from "@/lib/i18n/routes";
import { primaryNav } from "@/components/layout/nav";
import type { SessionUser } from "@/lib/auth/session-token";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  user: SessionUser | null;
};

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function MobileMenu({ open, onClose, user }: MobileMenuProps) {
  const mounted = useIsClient();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const main = document.getElementById("содржина");
    const header = document.querySelector("header[data-site-header]");

    document.body.classList.add("antika-menu-open");
    document.body.style.overflow = "hidden";
    main?.setAttribute("aria-hidden", "true");
    header?.setAttribute("aria-hidden", "true");

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("antika-menu-open");
      document.body.style.overflow = "";
      main?.removeAttribute("aria-hidden");
      header?.removeAttribute("aria-hidden");
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="antika-mobile-menu lg:hidden" role="dialog" aria-modal="true" aria-label="Мени">
      <div className="antika-mobile-menu__panel flex h-full w-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-5">
          <p className="font-serif text-xl tracking-[0.22em]">ANTIKA</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-[0.75rem] tracking-[0.18em] uppercase"
          >
            Затвори
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-10" aria-label="Главно мени">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="py-3.5 font-serif text-[2.35rem] leading-none tracking-tight transition-opacity duration-300 hover:opacity-60 sm:text-4xl"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line px-5 py-8 text-[0.8rem] tracking-[0.16em] uppercase text-muted">
          <Link href={publicPaths.search} onClick={onClose} className="block min-h-11 py-3">
            Пребарај
          </Link>
          <Link href={publicPaths.favorites} onClick={onClose} className="block min-h-11 py-3">
            Омилени
          </Link>
          {user ? (
            <>
              <Link href={publicPaths.profile} onClick={onClose} className="block min-h-11 py-3">
                Мој профил
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="block min-h-11 py-3 uppercase tracking-[0.16em]">
                  Одјави се
                </button>
              </form>
            </>
          ) : (
            <Link href={publicPaths.login} onClick={onClose} className="block min-h-11 py-3">
              Корисник
            </Link>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
