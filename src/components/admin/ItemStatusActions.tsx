"use client";

import { ItemStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { canHardDeleteItem, canTransitionItemStatus, isCatalogArchivable } from "@/lib/domain/item-status";
import { itemStatusLabels } from "@/lib/domain/labels";
import {
  archiveItemAction,
  changeItemStatusAction,
  deleteItemAction,
} from "@/server/actions/items";
import { reverseSaleAction } from "@/server/actions/commerce";

const CATALOG_ACTIONS: ItemStatus[] = [
  ItemStatus.DRAFT,
  ItemStatus.PUBLISHED,
  ItemStatus.AVAILABLE,
  ItemStatus.ARCHIVED,
];

export function ItemStatusActions({
  itemId,
  status,
  hasCommerceHistory,
  fulfilledOrderId,
}: {
  itemId: string;
  status: ItemStatus;
  hasCommerceHistory: boolean;
  fulfilledOrderId?: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<"archive" | "delete" | "reverse" | null>(null);

  async function applyStatus(value: ItemStatus) {
    if (pending) return;
    setPending(true);
    try {
      const result = await changeItemStatusAction(itemId, value);
      setMessage(result.ok ? `Статус: ${itemStatusLabels[value]}` : result.message);
      if (result.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function runConfirmed() {
    if (!confirm || pending) return;
    setPending(true);
    try {
      if (confirm === "archive") {
        const result = await archiveItemAction(itemId);
        setMessage(result.ok ? "Предметот е архивиран." : result.message);
        if (result.ok) router.refresh();
      } else if (confirm === "delete") {
        const result = await deleteItemAction(itemId);
        if (result.ok) {
          router.push("/admin/items");
          router.refresh();
          return;
        }
        setMessage(result.message);
      } else if (confirm === "reverse" && fulfilledOrderId) {
        const result = await reverseSaleAction(fulfilledOrderId);
        setMessage(
          result.ok
            ? "Продажбата е поништена. Предметот е повторно достапен."
            : result.message,
        );
        if (result.ok) router.refresh();
      }
    } finally {
      setPending(false);
      setConfirm(null);
    }
  }

  const showDelete = canHardDeleteItem(status, hasCommerceHistory);
  const showArchive = isCatalogArchivable(status) && status !== ItemStatus.ARCHIVED;
  const showReverse = status === ItemStatus.SOLD && Boolean(fulfilledOrderId);

  return (
    <div className="space-y-4 border border-line p-4">
      <div className="space-y-1">
        <p className="text-[0.72rem] uppercase tracking-[0.16em] text-muted">Каталог статус</p>
        <p className="text-sm">
          {status === ItemStatus.RESERVED || status === ItemStatus.SOLD
            ? `Комерција: ${itemStatusLabels[status]}`
            : itemStatusLabels[status]}
        </p>
      </div>

      {status !== ItemStatus.RESERVED && status !== ItemStatus.SOLD ? (
        <div className="flex flex-wrap gap-2">
          {CATALOG_ACTIONS.filter(
            (value) => value !== status && canTransitionItemStatus(status, value),
          ).map((value) => (
            <button
              key={value}
              type="button"
              disabled={pending}
              className="border border-ink/20 px-3 py-2 text-[0.68rem] uppercase tracking-wider disabled:opacity-50"
              onClick={() => {
                if (value === ItemStatus.ARCHIVED) {
                  setConfirm("archive");
                  return;
                }
                void applyStatus(value);
              }}
            >
              {itemStatusLabels[value]}
            </button>
          ))}
        </div>
      ) : null}

      {status === ItemStatus.SOLD ? (
        <p className="text-sm text-muted">Продажбата е финализирана</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {showArchive ? (
          <button
            type="button"
            disabled={pending}
            className="border border-ink/20 px-3 py-2 text-[0.68rem] uppercase tracking-wider disabled:opacity-50"
            onClick={() => setConfirm("archive")}
          >
            Архивирај предмет
          </button>
        ) : null}
        {showDelete ? (
          <button
            type="button"
            disabled={pending}
            className="border border-walnut/40 px-3 py-2 text-[0.68rem] uppercase tracking-wider text-walnut disabled:opacity-50"
            onClick={() => setConfirm("delete")}
          >
            Избриши предмет
          </button>
        ) : null}
        {showReverse ? (
          <button
            type="button"
            disabled={pending}
            className="border border-ink px-3 py-2 text-[0.68rem] uppercase tracking-wider disabled:opacity-50"
            onClick={() => setConfirm("reverse")}
          >
            Поништи продажба
          </button>
        ) : null}
      </div>

      {message ? <p className="text-sm text-walnut">{message}</p> : null}

      <ConfirmDialog
        open={confirm === "archive"}
        title="Архивирај предмет"
        message="Предметот ќе се сокрие од јавниот каталог, но ќе остане во базата со сите податоци и фотографии."
        confirmLabel="Архивирај"
        pending={pending}
        onCancel={() => !pending && setConfirm(null)}
        onConfirm={() => void runConfirmed()}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="Избриши предмет"
        message="Дали сте сигурни дека сакате да го избришете предметот? Оваа акција не може да се врати."
        confirmLabel="Избриши"
        tone="danger"
        pending={pending}
        onCancel={() => !pending && setConfirm(null)}
        onConfirm={() => void runConfirmed()}
      />
      <ConfirmDialog
        open={confirm === "reverse"}
        title="Поништи продажба"
        message="Оваа акција ќе го врати предметот во достапни предмети, но историската нарачка ќе остане зачувана. Дали сте сигурни?"
        confirmLabel="Поништи продажба"
        pending={pending}
        onCancel={() => !pending && setConfirm(null)}
        onConfirm={() => void runConfirmed()}
      />
    </div>
  );
}
