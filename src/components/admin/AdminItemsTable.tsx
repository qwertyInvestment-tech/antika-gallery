"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ItemStatus } from "@prisma/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toPublicImageSrc } from "@/lib/catalog/media";
import { itemStatusLabels } from "@/lib/domain/labels";
import { canHardDeleteItem, isCatalogArchivable } from "@/lib/domain/item-status";
import {
  bulkArchiveItemsAction,
  bulkDeleteItemsAction,
} from "@/server/actions/items";

export type AdminItemRow = {
  id: string;
  referenceNumber: string;
  title: string;
  status: ItemStatus;
  price: string;
  currency: string;
  createdAtLabel: string;
  categoryName: string;
  photoUrl: string | null;
  photoAlt: string;
  hasCommerceHistory: boolean;
};

export function AdminItemsTable({ items }: { items: AdminItemRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmKind, setConfirmKind] = useState<"archive" | "delete" | null>(null);

  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id));
  const selectedCount = selected.size;

  const selectedItems = useMemo(
    () => items.filter((item) => selected.has(item.id)),
    [items, selected],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(items.map((item) => item.id)));
  }

  async function runBulk(kind: "archive" | "delete") {
    if (pending || selectedCount === 0) return;
    setPending(true);
    setMessage(null);
    try {
      const ids = [...selected];
      const result =
        kind === "archive" ? await bulkArchiveItemsAction(ids) : await bulkDeleteItemsAction(ids);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setSelected(new Set());
      setMessage(kind === "archive" ? "Избраните предмети се архивирани." : "Избраните предмети се избришани.");
      router.refresh();
    } finally {
      setPending(false);
      setConfirmKind(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 border border-line px-3 py-3 text-sm">
        <span className="text-muted">Избрани: {selectedCount}</span>
        <button
          type="button"
          disabled={selectedCount === 0 || pending}
          className="border border-ink/20 px-3 py-2 text-[0.68rem] uppercase tracking-wider disabled:opacity-40"
          onClick={() => setConfirmKind("archive")}
        >
          Архивирај избрани
        </button>
        <button
          type="button"
          disabled={selectedCount === 0 || pending}
          className="border border-walnut/40 px-3 py-2 text-[0.68rem] uppercase tracking-wider text-walnut disabled:opacity-40"
          onClick={() => setConfirmKind("delete")}
        >
          Избриши избрани
        </button>
        {message ? <p className="basis-full text-sm text-walnut">{message}</p> : null}
      </div>

      <ul className="space-y-4 md:hidden">
        {items.map((item) => {
          const src = toPublicImageSrc(item.photoUrl);
          return (
            <li key={item.id} className="border border-line p-4">
              <div className="flex gap-4">
                <div className="shrink-0">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={item.photoAlt} className="h-20 w-20 object-cover" />
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                      aria-label={`Избери ${item.referenceNumber}`}
                    />
                    <div>
                      <p className="text-[0.68rem] uppercase tracking-wider text-muted">{item.referenceNumber}</p>
                      <Link href={`/admin/items/${item.id}`} className="font-medium underline underline-offset-4">
                        {item.title}
                      </Link>
                    </div>
                  </div>
                  <p className="text-muted">
                    {item.categoryName} · {item.price} {item.currency}
                  </p>
                  <p className="text-muted">
                    {itemStatusLabels[item.status]} · {item.createdAtLabel}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
        {items.length === 0 ? <li className="text-muted">Нема предмети за овој филтер.</li> : null}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="text-[0.68rem] uppercase tracking-wider text-muted">
            <tr>
              <th className="pb-3 pr-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Избери ги сите на страницата"
                />
              </th>
              <th className="pb-3">Фото</th>
              <th className="pb-3">Референца</th>
              <th className="pb-3">Назив</th>
              <th className="pb-3">Категорија</th>
              <th className="pb-3">Цена</th>
              <th className="pb-3">Статус</th>
              <th className="pb-3">Создадено</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const src = toPublicImageSrc(item.photoUrl);
              return (
                <tr key={item.id} className="border-t border-line">
                  <td className="py-3 pr-2">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Избери ${item.referenceNumber}`}
                    />
                  </td>
                  <td className="py-3 pr-3">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={item.photoAlt} className="h-14 w-14 object-cover" />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">{item.referenceNumber}</td>
                  <td className="py-3 pr-3">
                    <Link href={`/admin/items/${item.id}`} className="underline underline-offset-4">
                      {item.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-3">{item.categoryName}</td>
                  <td className="py-3 pr-3">
                    {item.price} {item.currency}
                  </td>
                  <td className="py-3 pr-3">{itemStatusLabels[item.status]}</td>
                  <td className="py-3">{item.createdAtLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 ? <p className="mt-6 text-muted">Нема предмети за овој филтер.</p> : null}
      </div>

      <ConfirmDialog
        open={confirmKind === "archive"}
        title="Архивирај избрани"
        message={
          selectedItems.some((item) => !isCatalogArchivable(item.status))
            ? `${selectedItems.filter((item) => !isCatalogArchivable(item.status)).length} предмети не можат да се архивираат бидејќи се резервирани или продадени.`
            : `Дали сте сигурни дека сакате да ги архивирате ${selectedCount} избрани предмети?`
        }
        confirmLabel="Архивирај"
        pending={pending}
        onCancel={() => !pending && setConfirmKind(null)}
        onConfirm={() => {
          if (selectedItems.some((item) => !isCatalogArchivable(item.status))) {
            setMessage(
              `${selectedItems.filter((item) => !isCatalogArchivable(item.status)).length} предмети не можат да се архивираат бидејќи се резервирани или продадени.`,
            );
            setConfirmKind(null);
            return;
          }
          void runBulk("archive");
        }}
      />

      <ConfirmDialog
        open={confirmKind === "delete"}
        title="Избриши избрани"
        message={
          selectedItems.some((item) => !canHardDeleteItem(item.status, item.hasCommerceHistory))
            ? "Предметот не може да се избрише бидејќи има историја на продажба или резервација."
            : "Дали сте сигурни дека сакате да ги избришете избраните предмети? Оваа акција не може да се врати."
        }
        confirmLabel="Избриши"
        tone="danger"
        pending={pending}
        onCancel={() => !pending && setConfirmKind(null)}
        onConfirm={() => {
          if (selectedItems.some((item) => !canHardDeleteItem(item.status, item.hasCommerceHistory))) {
            setMessage("Предметот не може да се избрише бидејќи има историја на продажба или резервација.");
            setConfirmKind(null);
            return;
          }
          void runBulk("delete");
        }}
      />
    </div>
  );
}
