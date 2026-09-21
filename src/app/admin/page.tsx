import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatReservationRemaining } from "@/lib/domain/reservation-status";
import { getAdminDashboard } from "@/server/services/admin-dashboard-service";

export const dynamic = "force-dynamic";

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <div className="border-b border-line pb-4">
      <dt className="text-[0.68rem] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-2 font-serif text-3xl">
        <Link href={href} className="underline-offset-4 hover:underline">
          {value}
        </Link>
      </dd>
    </div>
  );
}

export default async function AdminPage() {
  const [user, dashboard] = await Promise.all([getSessionUser(), getAdminDashboard()]);

  return (
    <AdminShell title="Контролна табла">
      <p className="max-w-xl text-muted">Добре дојдовте, {user?.name}. Каталогот е активен.</p>

      <dl className="mt-10 grid gap-8 sm:grid-cols-3">
        <Stat label="Вкупно предмети" value={dashboard.counts.items} href="/admin/items" />
        <Stat label="Достапни" value={dashboard.counts.available} href="/admin/items?status=AVAILABLE" />
        <Stat label="Резервирани" value={dashboard.counts.reserved} href="/admin/items?status=RESERVED" />
        <Stat label="Продадени" value={dashboard.counts.sold} href="/admin/items?status=SOLD" />
        <Stat label="Нови барања" value={dashboard.counts.newInquiries} href="/admin/inquiries?status=NEW" />
        <Stat label="Активни резервации" value={dashboard.counts.activeReservations} href="/admin/reservations?status=ACTIVE" />
      </dl>

      <section className="mt-16 grid gap-14 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-2xl">Нови интересирања</h2>
            <Link href="/admin/inquiries?status=NEW" className="text-[0.68rem] uppercase tracking-wider text-muted underline underline-offset-4">
              Сите
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            {dashboard.newInquiries.map((row) => (
              <li key={row.id} className="border-t border-line pt-3">
                <Link href={`/admin/inquiries/${row.id}`} className="underline underline-offset-4">
                  {row.name}
                </Link>
                <p className="mt-1 text-muted">
                  {row.item ? `${row.item.referenceNumber} · ${row.item.title}` : "Општа порака"}
                </p>
              </li>
            ))}
            {dashboard.newInquiries.length === 0 ? <li className="text-muted">Нема нови барања.</li> : null}
          </ul>
        </div>

        <div>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-2xl">Барања за предмет</h2>
            <Link href="/admin/requests?status=NEW" className="text-[0.68rem] uppercase tracking-wider text-muted underline underline-offset-4">
              Сите
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            {dashboard.newRequests.map((row) => (
              <li key={row.id} className="border-t border-line pt-3">
                <Link href={`/admin/requests/${row.id}`} className="underline underline-offset-4">
                  {row.name}
                </Link>
                <p className="mt-1 text-muted">{row.description.slice(0, 80)}{row.description.length > 80 ? "…" : ""}</p>
              </li>
            ))}
            {dashboard.newRequests.length === 0 ? <li className="text-muted">Нема нови барања за пронаоѓање.</li> : null}
          </ul>
        </div>

        <div>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-2xl">Активни резервации</h2>
            <Link href="/admin/reservations?status=ACTIVE" className="text-[0.68rem] uppercase tracking-wider text-muted underline underline-offset-4">
              Сите
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            {dashboard.activeReservations.map((row) => (
              <li key={row.id} className="border-t border-line pt-3">
                <Link href={`/admin/reservations/${row.id}`} className="underline underline-offset-4">
                  {row.item.referenceNumber} · {row.customerName}
                </Link>
                <p className="mt-1 text-muted">{formatReservationRemaining(row.reservedUntil)}</p>
              </li>
            ))}
            {dashboard.activeReservations.length === 0 ? <li className="text-muted">Нема активни резервации.</li> : null}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 font-serif text-2xl">Истекуваат наскоро</h2>
          <ul className="space-y-3 text-sm">
            {dashboard.expiringReservations.map((row) => (
              <li key={row.id} className="border-t border-line pt-3">
                <Link href={`/admin/reservations/${row.id}`} className="underline underline-offset-4">
                  {row.item.referenceNumber} · {row.customerName}
                </Link>
                <p className="mt-1 text-walnut">{formatReservationRemaining(row.reservedUntil)}</p>
              </li>
            ))}
            {dashboard.expiringReservations.length === 0 ? (
              <li className="text-muted">Нема резервации што истекуваат во следните 12 часа.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </AdminShell>
  );
}
