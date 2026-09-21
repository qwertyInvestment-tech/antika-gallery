"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { FulfillmentMethod, ReservationStatus } from "@prisma/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  cancelReservationAction,
  confirmSaleAction,
  reserveItemAction,
  type CommerceActionResult,
} from "@/server/actions/commerce";
import { fulfillmentLabels } from "@/lib/domain/fulfillment";

type InquiryOption = { id: string; name: string; email: string };

export function ReserveForm({
  itemId,
  inquiries,
}: {
  itemId: string;
  inquiries: InquiryOption[];
}) {
  const [state, action, pending] = useActionState<CommerceActionResult | null, FormData>(
    reserveItemAction,
    null,
  );

  if (inquiries.length === 0) {
    return <p className="text-sm text-muted">Прво е потребно барање за овој предмет.</p>;
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="itemId" value={itemId} />
      <label className="block text-sm">
        Барање
        <select name="inquiryId" required className="mt-1 w-full border border-ink/15 bg-ivory-soft px-3 py-2 text-sm">
          {inquiries.map((inquiry) => (
            <option key={inquiry.id} value={inquiry.id}>
              {inquiry.name} · {inquiry.email}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Преземање
        <select name="fulfillmentMethod" className="mt-1 w-full border border-ink/15 bg-ivory-soft px-3 py-2 text-sm">
          <option value={FulfillmentMethod.PICKUP}>{fulfillmentLabels.PICKUP}</option>
          <option value={FulfillmentMethod.ARRANGED_DELIVERY}>{fulfillmentLabels.ARRANGED_DELIVERY}</option>
        </select>
      </label>
      {state && !state.ok ? <p className="text-sm text-walnut">{state.message}</p> : null}
      <button type="submit" disabled={pending} className="border border-ink px-3 py-2 text-[0.68rem] uppercase tracking-wider">
        {pending ? "Се резервира…" : "Резервирај"}
      </button>
    </form>
  );
}

export function ActiveReservationActions({
  reservationId,
  expired,
  status = ReservationStatus.ACTIVE,
}: {
  reservationId: string;
  expired: boolean;
  status?: ReservationStatus;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<"confirm" | "cancel" | null>(null);
  const [dialog, setDialog] = useState<"confirm" | "cancel" | null>(null);

  if (expired || status === ReservationStatus.EXPIRED) {
    return <p className="text-sm text-walnut">Резервацијата е истечена</p>;
  }
  if (status !== ReservationStatus.ACTIVE) {
    return null;
  }

  async function run(kind: "confirm" | "cancel") {
    if (pending) return;
    setPending(kind);
    try {
      const result =
        kind === "confirm"
          ? await confirmSaleAction(reservationId)
          : await cancelReservationAction(reservationId);
      setMessage(
        result.ok
          ? kind === "confirm"
            ? "Продажбата е потврдена."
            : "Резервацијата е откажана."
          : result.message,
      );
      if (result.ok) router.refresh();
    } finally {
      setPending(null);
      setDialog(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending !== null}
        className="border border-ink px-3 py-2 text-[0.68rem] uppercase tracking-wider disabled:opacity-50"
        onClick={() => setDialog("confirm")}
      >
        {pending === "confirm" ? "Се обработува…" : "Потврди продажба"}
      </button>
      <button
        type="button"
        disabled={pending !== null}
        className="border border-ink/20 px-3 py-2 text-[0.68rem] uppercase tracking-wider disabled:opacity-50"
        onClick={() => setDialog("cancel")}
      >
        {pending === "cancel" ? "Се обработува…" : "Откажи резервација"}
      </button>
      {message ? <p className="basis-full text-sm text-walnut">{message}</p> : null}

      <ConfirmDialog
        open={dialog === "confirm"}
        title="Потврди продажба"
        message="Оваа акција ќе ја финализира продажбата, ќе создаде нарачка и ќе го означи предметот како продаден. Дали сте сигурни?"
        confirmLabel="Потврди продажба"
        pending={pending === "confirm"}
        onCancel={() => pending === null && setDialog(null)}
        onConfirm={() => void run("confirm")}
      />
      <ConfirmDialog
        open={dialog === "cancel"}
        title="Откажи резервација"
        message="Резервацијата ќе се откаже и предметот повторно ќе стане достапен во каталогот. Дали сте сигурни?"
        confirmLabel="Откажи резервација"
        pending={pending === "cancel"}
        onCancel={() => pending === null && setDialog(null)}
        onConfirm={() => void run("cancel")}
      />
    </div>
  );
}
