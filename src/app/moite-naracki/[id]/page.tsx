import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/auth/session";
import { getCustomerOrder } from "@/server/services/customer-commerce-service";
import { formatItemPrice } from "@/lib/catalog/money";
import { fulfillmentLabels } from "@/lib/domain/fulfillment";
import { orderStatusLabels } from "@/lib/domain/order-status";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { CustomerNav } from "@/components/customer/CustomerNav";

export const dynamic = "force-dynamic";

export default async function MyOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  let order;
  try {
    order = await getCustomerOrder(session.id, id);
  } catch (error) {
    if (error instanceof AppError && (error.status === 403 || error.status === 404)) notFound();
    throw error;
  }

  return (
    <SiteShell>
      <Container width="narrow" className="py-16 md:py-24">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Нарачка</p>
        <h1 className="mt-4 font-serif text-5xl">{order.orderNumber}</h1>
        <CustomerNav />
        <dl className="mt-12 grid gap-6 text-sm">
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Статус</dt>
            <dd className="mt-1">{orderStatusLabels[order.status]}</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Преземање</dt>
            <dd className="mt-1">{fulfillmentLabels[order.fulfillmentMethod]}</dd>
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
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Износ</dt>
            <dd className="mt-1">{formatItemPrice(order.total, order.currency)}</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Датум</dt>
            <dd className="mt-1">{order.createdAt.toLocaleString("mk-MK")}</dd>
          </div>
        </dl>
      </Container>
    </SiteShell>
  );
}
