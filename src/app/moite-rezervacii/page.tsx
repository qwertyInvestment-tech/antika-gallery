import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { listCustomerReservations } from "@/server/services/customer-commerce-service";
import { reservationStatusLabels } from "@/lib/domain/reservation-status";
import { itemPath } from "@/lib/i18n/routes";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { CustomerNav } from "@/components/customer/CustomerNav";

export const dynamic = "force-dynamic";

export default async function MyReservationsPage() {
  const session = await requireSession();
  const reservations = await listCustomerReservations(session.id);

  return (
    <SiteShell>
      <Container width="narrow" className="py-16 md:py-24">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Сметка</p>
        <h1 className="mt-4 font-serif text-5xl">Моите резервации</h1>
        <CustomerNav />
        <div className="mt-12 space-y-6">
          {reservations.length === 0 ? (
            <p className="text-muted">Немате резервации. Резервацијата ја прави ANTIKA по ваше барање.</p>
          ) : null}
          {reservations.map((reservation) => (
            <div key={reservation.id} className="border border-line p-5">
              <p className="text-[0.72rem] uppercase tracking-wider text-muted">
                {reservation.item.referenceNumber}
              </p>
              <p className="mt-2 font-serif text-2xl">
                <Link href={itemPath(reservation.item.slug)} className="underline-offset-4 hover:underline">
                  {reservation.item.title}
                </Link>
              </p>
              <p className="mt-2 text-sm text-muted">
                {reservationStatusLabels[reservation.status]} · резервирано{" "}
                {reservation.reservedAt.toLocaleString("mk-MK")} · до{" "}
                {reservation.reservedUntil.toLocaleString("mk-MK")}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </SiteShell>
  );
}
