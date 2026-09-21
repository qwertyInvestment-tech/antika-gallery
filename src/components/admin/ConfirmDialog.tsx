"use client";

import { useEffect } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Потврди",
  cancelLabel = "Откажи",
  pending = false,
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4"
      onClick={() => {
        if (!pending) onCancel();
      }}
    >
      <div
        className="w-full max-w-md border border-line bg-ivory p-5 shadow-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="font-serif text-xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-charcoal/85">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            className="border border-ink/20 px-3 py-2 text-[0.68rem] uppercase tracking-wider disabled:opacity-50"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            className={`border px-3 py-2 text-[0.68rem] uppercase tracking-wider disabled:opacity-50 ${
              tone === "danger" ? "border-walnut text-walnut" : "border-ink"
            }`}
            onClick={onConfirm}
          >
            {pending ? "Се обработува…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
