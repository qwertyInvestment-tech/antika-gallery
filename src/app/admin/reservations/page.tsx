import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatReservationRemaining, reservationAdminStatuses, reservationStatusLabels } from "@/lib/domain/reservation-status";
import { listReservations } from "@/server/services/commerce-service";

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const statusRaw = typeof params.status === "string" ? params.status : "";
  const status = reservationAdminStatuses.find((value) => value === statusRaw);
  const reservations = await listReservations({ q, status });

  return (
    <AdminShell title="Резервации">
      <form className="mb-8 grid gap-3 border border-line p-4 md:grid-cols-3">
        <input name="q" defaultValue={q} placeholder="Име, е-пошта, референца" className="border border-ink/15 bg-ivory-soft px-3 py-2 text-sm" />
        <select name="status" defaultValue={status ?? ""} className="border border-ink/15 bg-ivory-soft px-3 py-2 text-sm">
          <option value="">Сите статуси</option>
          {reservationAdminStatuses.map((value) => (
            <option key={value} value={value}>
              {reservationStatusLabels[value]}
            </option>
          ))}
        </select>
        <button type="submit" className="border border-ink px-3 py-2 text-[0.72rem] uppercase tracking-wider">
          Филтрирај
        </button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="text-[0.68rem] uppercase tracking-wider text-muted">
            <tr>
              <th className="pb-3">Купувач</th>
              <th className="pb-3">Предмет</th>
              <th className="pb-3">Статус</th>
              <th className="pb-3">До</th>
              <th className="pb-3">Останува</th>
              <th className="pb-3">Админ</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="py-3 pr-3">
                  <Link href={`/admin/reservations/${row.id}`} className="underline underline-offset-4">
                    {row.customerName}
                  </Link>
                  <p className="text-muted">{row.customerEmail}</p>
                </td>
                <td className="py-3 pr-3">
                  {row.item.referenceNumber} · {row.item.title}
                </td>
                <td className="py-3 pr-3">{reservationStatusLabels[row.status]}</td>
                <td className="py-3 pr-3">{row.reservedUntil.toLocaleString("mk-MK")}</td>
                <td className="py-3 pr-3">{formatReservationRemaining(row.reservedUntil)}</td>
                <td className="py-3">{row.createdByAdmin.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {reservations.length === 0 ? <p className="mt-6 text-muted">Нема резервации за овој филтер.</p> : null}
      </div>
    </AdminShell>
  );
}
