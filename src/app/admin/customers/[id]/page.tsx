import { requireAdmin } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatItemPrice } from "@/lib/catalog/money";
import { getCustomerAdminView } from "@/server/services/account-service";
import { inquiryStatusLabels } from "@/lib/domain/inquiry-status";
import { orderStatusLabels } from "@/lib/domain/order-status";
import { reservationStatusLabels } from "@/lib/domain/reservation-status";
import { requestStatusLabels } from "@/lib/domain/request-status";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const customer = await getCustomerAdminView(id);
  if (!customer) notFound();

  return (
    <AdminShell title={customer.name}>
      <dl className="grid max-w-2xl gap-5 text-sm">
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Е-пошта</dt>
          <dd className="mt-1">{customer.email}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Телефон</dt>
          <dd className="mt-1">{customer.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Сметка од</dt>
          <dd className="mt-1">{customer.createdAt.toLocaleDateString("mk-MK")}</dd>
        </div>
      </dl>

      <h2 className="mt-12 font-serif text-2xl">Нарачки</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {customer.orders.map((order) => (
          <li key={order.id}>
            <Link href={`/admin/orders/${order.id}`} className="underline underline-offset-4">
              {order.orderNumber}
            </Link>{" "}
            · {orderStatusLabels[order.status]} · {formatItemPrice(order.total, order.currency)}
          </li>
        ))}
        {customer.orders.length === 0 ? <li className="text-muted">Нема нарачки.</li> : null}
      </ul>

      <h2 className="mt-12 font-serif text-2xl">Резервации</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {customer.reservationsOwned.map((row) => (
          <li key={row.id}>
            <Link href={`/admin/reservations/${row.id}`} className="underline underline-offset-4">
              {row.item.referenceNumber} · {row.item.title}
            </Link>{" "}
            · {reservationStatusLabels[row.status]}
          </li>
        ))}
        {customer.reservationsOwned.length === 0 ? <li className="text-muted">Нема резервации.</li> : null}
      </ul>

      <h2 className="mt-12 font-serif text-2xl">Барања</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {customer.inquiries.map((row) => (
          <li key={row.id}>
            <Link href={`/admin/inquiries/${row.id}`} className="underline underline-offset-4">
              {row.item ? `${row.item.referenceNumber} · ${row.item.title}` : "Општа порака"}
            </Link>{" "}
            · {inquiryStatusLabels[row.status]}
          </li>
        ))}
        {customer.inquiries.length === 0 ? <li className="text-muted">Нема барања.</li> : null}
      </ul>

      <h2 className="mt-12 font-serif text-2xl">Побарано</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {customer.itemRequests.map((row) => (
          <li key={row.id}>
            <Link href={`/admin/requests/${row.id}`} className="underline underline-offset-4">
              {row.description}
            </Link>{" "}
            · {requestStatusLabels[row.status]}
          </li>
        ))}
        {customer.itemRequests.length === 0 ? <li className="text-muted">Нема барања за предмет.</li> : null}
      </ul>
    </AdminShell>
  );
}
