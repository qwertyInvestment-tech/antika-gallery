import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { listCustomerOrders } from "@/server/services/customer-commerce-service";
import { formatItemPrice } from "@/lib/catalog/money";
import { orderStatusLabels } from "@/lib/domain/order-status";
import { customerOrderPath } from "@/lib/i18n/routes";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { CustomerNav } from "@/components/customer/CustomerNav";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const session = await requireSession();
  const orders = await listCustomerOrders(session.id);

  return (
    <SiteShell>
      <Container width="narrow" className="py-16 md:py-24">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Сметка</p>
        <h1 className="mt-4 font-serif text-5xl">Моите нарачки</h1>
        <CustomerNav />
        <div className="mt-12 space-y-6">
          {orders.length === 0 ? <p className="text-muted">Сè уште немате нарачки.</p> : null}
          {orders.map((order) => (
            <Link
              key={order.id}
              href={customerOrderPath(order.id)}
              className="block border border-line p-5 hover:border-ink/40"
            >
              <p className="text-[0.72rem] uppercase tracking-wider text-muted">{order.orderNumber}</p>
              <p className="mt-2 font-serif text-2xl">
                {order.items.map((item) => item.title).join(", ") || "Нарачка"}
              </p>
              <p className="mt-2 text-sm text-muted">
                {order.items.map((item) => item.reference).join(", ")} · {formatItemPrice(order.total, order.currency)} ·{" "}
                {orderStatusLabels[order.status]} · {order.createdAt.toLocaleDateString("mk-MK")}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </SiteShell>
  );
}
