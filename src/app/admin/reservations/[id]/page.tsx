import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ActiveReservationActions } from "@/components/admin/ReservationPanel";
import { fulfillmentLabels } from "@/lib/domain/fulfillment";
import { formatReservationRemaining, isReservationExpired, reservationStatusLabels } from "@/lib/domain/reservation-status";
import { getReservationById } from "@/server/services/commerce-service";

export const dynamic = "force-dynamic";

export default async function AdminReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservation = await getReservationById(id);
  if (!reservation) notFound();
  const expired = reservation.status === "ACTIVE" && isReservationExpired(reservation.reservedUntil);

  return (
    <AdminShell title="Резервација">
      <dl className="grid max-w-2xl gap-5 text-sm">
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Купувач</dt>
          <dd className="mt-1">
            {reservation.customerName}
            <br />
            {reservation.customerEmail}
            <br />
            {reservation.customerPhone || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Предмет</dt>
          <dd className="mt-1">
            <Link href={`/admin/items/${reservation.item.id}`} className="underline underline-offset-4">
              {reservation.item.referenceNumber} · {reservation.item.title}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Статус</dt>
          <dd className="mt-1">{expired ? "Истечена" : reservationStatusLabels[reservation.status]}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Резервирано</dt>
          <dd className="mt-1">{reservation.reservedAt.toLocaleString("mk-MK")}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Истекува</dt>
          <dd className="mt-1">{reservation.reservedUntil.toLocaleString("mk-MK")}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Останува</dt>
          <dd className="mt-1">{formatReservationRemaining(reservation.reservedUntil)}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Преземање</dt>
          <dd className="mt-1">{fulfillmentLabels[reservation.fulfillmentMethod]}</dd>
        </div>
        <div>
          <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Админ</dt>
          <dd className="mt-1">{reservation.createdByAdmin.name}</dd>
        </div>
        {reservation.order ? (
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Нарачка</dt>
            <dd className="mt-1">
              <Link href={`/admin/orders/${reservation.order.id}`} className="underline underline-offset-4">
                {reservation.order.orderNumber}
              </Link>
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-8">
        <ActiveReservationActions
          reservationId={reservation.id}
          expired={expired}
          status={reservation.status}
        />
      </div>
    </AdminShell>
  );
}
