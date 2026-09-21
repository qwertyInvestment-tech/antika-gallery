import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { orderAdminStatuses, orderStatusLabels } from "@/lib/domain/order-status";
import { formatItemPrice } from "@/lib/catalog/money";
import { listOrders } from "@/server/services/commerce-service";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const statusRaw = typeof params.status === "string" ? params.status : "";
  const status = orderAdminStatuses.find((value) => value === statusRaw);
  const orders = await listOrders({ q, status });

  return (
    <AdminShell title="Нарачки">
      <form className="mb-8 grid gap-3 border border-line p-4 md:grid-cols-3">
        <input name="q" defaultValue={q} placeholder="Број, име, референца" className="border border-ink/15 bg-ivory-soft px-3 py-2 text-sm" />
        <select name="status" defaultValue={status ?? ""} className="border border-ink/15 bg-ivory-soft px-3 py-2 text-sm">
          <option value="">Сите статуси</option>
          {orderAdminStatuses.map((value) => (
            <option key={value} value={value}>
              {orderStatusLabels[value]}
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
              <th className="pb-3">Број</th>
              <th className="pb-3">Купувач</th>
              <th className="pb-3">Предмет</th>
              <th className="pb-3">Цена</th>
              <th className="pb-3">Статус</th>
              <th className="pb-3">Создадено</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-line">
                <td className="py-3 pr-3">
                  <Link href={`/admin/orders/${order.id}`} className="underline underline-offset-4">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="py-3 pr-3">
                  {order.customerName}
                  <p className="text-muted">{order.email}</p>
                </td>
                <td className="py-3 pr-3">
                  {order.items.map((item) => `${item.reference} · ${item.title}`).join(", ")}
                </td>
                <td className="py-3 pr-3">{formatItemPrice(order.total, order.currency)}</td>
                <td className="py-3 pr-3">{orderStatusLabels[order.status]}</td>
                <td className="py-3">{order.createdAt.toLocaleDateString("mk-MK")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 ? <p className="mt-6 text-muted">Нема нарачки за овој филтер.</p> : null}
      </div>
    </AdminShell>
  );
}
