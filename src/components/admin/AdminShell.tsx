import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/server/actions/auth";
import { publicPaths } from "@/lib/i18n/routes";

export function AdminShell({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="min-h-full bg-ivory text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-serif text-xl tracking-[0.2em]">
              ANTIKA
            </Link>
            <nav className="flex gap-4 text-[0.72rem] tracking-[0.14em] uppercase text-muted">
              <Link href="/admin">Табла</Link>
              <Link href="/admin/items">Предмети</Link>
              <Link href="/admin/inquiries">Барања</Link>
              <Link href="/admin/reservations">Резервации</Link>
              <Link href="/admin/orders">Нарачки</Link>
              <Link href="/admin/requests">Побарано</Link>
              <Link href="/admin/customers">Корисници</Link>
              <Link href={publicPaths.home}>Јавна страна</Link>
            </nav>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-[0.72rem] tracking-[0.14em] uppercase">
              Одјави се
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-3xl">{title}</h1>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
