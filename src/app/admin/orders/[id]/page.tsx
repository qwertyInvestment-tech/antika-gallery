import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatItemPrice } from "@/lib/catalog/money";
import { fulfillmentLabels } from "@/lib/domain/fulfillment";
import { orderStatusLabels } from "@/lib/domain/order-status";
import { getOrderById } from "@/server/services/commerce-service";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <AdminShell title={order.orderNumber}>
      <dl className="grid max-w-2xl gap-5 text-sm">
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Купувач</dt>
          <dd className="mt-1">
            {order.customerName}
            <br />
            {order.email}
            <br />
            {order.phone || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Статус</dt>
          <dd className="mt-1">{orderStatusLabels[order.status]}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Преземање</dt>
          <dd className="mt-1">{fulfillmentLabels[order.fulfillmentMethod]}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Износ</dt>
          <dd className="mt-1">{formatItemPrice(order.total, order.currency)}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Предмети</dt>
          <dd className="mt-1 space-y-2">
            {order.items.map((item) => (
              <p key={item.id}>
                {item.reference} · {item.title} · {formatItemPrice(item.price, item.currency)}
              </p>
            ))}
          </dd>
        </div>
        {order.reservation ? (
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Резервација</dt>
            <dd className="mt-1">
              <Link href={`/admin/reservations/${order.reservation.id}`} className="underline underline-offset-4">
                Отвори резервација
              </Link>
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Админ</dt>
          <dd className="mt-1">{order.createdByAdmin?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Создадено</dt>
          <dd className="mt-1">{order.createdAt.toLocaleString("mk-MK")}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Ажурирано</dt>
          <dd className="mt-1">{order.updatedAt.toLocaleString("mk-MK")}</dd>
        </div>
      </dl>
    </AdminShell>
  );
}
