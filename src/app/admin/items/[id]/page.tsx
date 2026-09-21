import { notFound } from "next/navigation";
import Link from "next/link";
import { ItemStatus, MediaKind } from "@prisma/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ItemForm } from "@/components/admin/ItemForm";
import { ItemImageManager } from "@/components/admin/ItemImageManager";
import { ItemStatusActions } from "@/components/admin/ItemStatusActions";
import { ActiveReservationActions, ReserveForm } from "@/components/admin/ReservationPanel";
import { formatReservationRemaining, isReservationExpired } from "@/lib/domain/reservation-status";
import { findItemById, listCategories } from "@/server/repositories/item-repository";
import {
  getActiveReservationForItem,
  getFulfilledOrderForItem,
} from "@/server/services/commerce-service";
import { listInquiriesForItem } from "@/server/services/inquiry-service";
import { getItemCommerceGuards } from "@/server/services/item-service";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, categories, inquiries, reservation, guards, fulfilledOrder] = await Promise.all([
    findItemById(id),
    listCategories(),
    listInquiriesForItem(id),
    getActiveReservationForItem(id),
    getItemCommerceGuards(id),
    getFulfilledOrderForItem(id),
  ]);
  if (!item) notFound();
  const expired = reservation ? isReservationExpired(reservation.reservedUntil) : false;

  return (
    <AdminShell title={item.referenceNumber}>
      <p className="mb-6 text-sm text-muted">{item.title}</p>
      <div className="mb-10 space-y-6">
        <ItemStatusActions
          itemId={item.id}
          status={item.status}
          hasCommerceHistory={guards.hasCommerceHistory}
          fulfilledOrderId={fulfilledOrder?.id ?? null}
        />
        <div className="border border-line p-4">
          <p className="text-[0.72rem] uppercase tracking-[0.16em] text-muted">Комерција / резервација</p>
          {item.status === ItemStatus.AVAILABLE ? (
            <div className="mt-4">
              <ReserveForm itemId={item.id} inquiries={inquiries} />
            </div>
          ) : null}
          {reservation ? (
            <div className="mt-4 space-y-2 text-sm">
              <p>
                Купувач: {reservation.customerName} · {reservation.customerEmail}
              </p>
              <p>Резервирано: {reservation.reservedAt.toLocaleString("mk-MK")}</p>
              <p>Истекува: {reservation.reservedUntil.toLocaleString("mk-MK")}</p>
              <p>{formatReservationRemaining(reservation.reservedUntil)}</p>
              <ActiveReservationActions reservationId={reservation.id} expired={expired} />
              <Link href={`/admin/reservations/${reservation.id}`} className="block underline underline-offset-4">
                Детал на резервација
              </Link>
            </div>
          ) : item.status === ItemStatus.RESERVED ? (
            <p className="mt-4 text-sm text-walnut">Резервацијата е истечена</p>
          ) : null}
          {item.status === ItemStatus.SOLD && fulfilledOrder ? (
            <p className="mt-4 text-sm text-muted">
              Нарачка:{" "}
              <Link href={`/admin/orders/${fulfilledOrder.id}`} className="underline underline-offset-4">
                {fulfilledOrder.orderNumber}
              </Link>
            </p>
          ) : null}
        </div>
      </div>
      <div className="mb-12">
        <ItemImageManager
          itemId={item.id}
          images={item.images.map((image) => ({
            id: image.id,
            isPrimary: image.isPrimary,
            sortOrder: image.sortOrder,
            asset: {
              url: image.asset.url,
              alt: image.asset.alt,
              kind: image.asset.kind ?? MediaKind.IMAGE,
              mimeType: image.asset.mimeType,
              durationSeconds: image.asset.durationSeconds,
            },
          }))}
        />
      </div>
      <ItemForm
        categories={categories}
        item={{
          id: item.id,
          title: item.title,
          slug: item.slug,
          categoryId: item.categoryId,
          shortDescription: item.shortDescription,
          description: item.description,
          price: item.price.toFixed(2),
          currency: item.currency,
          status: item.status,
          periodLabel: item.periodLabel,
          origin: item.origin,
          maker: item.maker,
          provenance: item.provenance,
          material: item.material,
          condition: item.condition,
          conditionNotes: item.conditionNotes,
          dimensions: item.dimensions,
          weight: item.weight,
          authenticityNotes: item.authenticityNotes,
          documentationNotes: item.documentationNotes,
          expertNotes: item.expertNotes,
          certificateNotes: item.certificateNotes,
          seoTitle: item.seoTitle,
          seoDescription: item.seoDescription,
        }}
      />
    </AdminShell>
  );
}
