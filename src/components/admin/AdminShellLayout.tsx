"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { logoutAction } from "@/server/actions/auth";
import { adminNavLinks } from "@/components/admin/admin-nav";

function navActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function AdminShellLayout({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const pathname = usePathname() || "/admin";
  const [menuOpen, setMenuOpen] = useState(false);
  const mounted = useIsClient();

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const drawer =
    menuOpen && mounted
      ? createPortal(
          <div className="antika-mobile-menu md:hidden" role="dialog" aria-modal="true" aria-label="Админ мени">
            <div className="antika-mobile-menu__panel flex h-full w-full flex-col">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <p className="font-serif text-lg tracking-[0.18em]">ANTIKA Admin</p>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-[0.72rem] tracking-[0.16em] uppercase"
                >
                  Затвори
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label="Админ навигација">
                <ul className="space-y-1 text-[0.78rem] tracking-[0.12em] uppercase">
                  {adminNavLinks.map((item) => {
                    const active = !item.external && navActive(pathname, item.href, item.exact === true);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={`block min-h-11 py-3 ${active ? "text-ink" : "text-muted"}`}
                          aria-current={active ? "page" : undefined}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div className="border-t border-line px-5 py-5">
                <form action={logoutAction}>
                  <button type="submit" className="min-h-11 text-[0.72rem] tracking-[0.14em] uppercase">
                    Одјави се
                  </button>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="min-h-full bg-ivory text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
            <Link href="/admin" className="shrink-0 font-serif text-xl tracking-[0.2em]">
              ANTIKA
            </Link>
            <nav
              className="hidden flex-wrap gap-x-4 gap-y-2 text-[0.72rem] tracking-[0.14em] uppercase text-muted md:flex"
              aria-label="Админ навигација"
            >
              {adminNavLinks.map((item) => {
                const active = !item.external && navActive(pathname, item.href, item.exact === true);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? "text-ink" : "transition-opacity hover:opacity-70"}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-[0.72rem] tracking-[0.14em] uppercase md:hidden"
              aria-expanded={menuOpen}
              aria-label="Отвори админ мени"
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <form action={logoutAction} className="hidden md:block">
              <button type="submit" className="text-[0.72rem] tracking-[0.14em] uppercase">
                Одјави се
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-8 md:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-3xl md:text-4xl">{title}</h1>
          {actions}
        </div>
        {children}
      </main>
      {drawer}
    </div>
  );
}
