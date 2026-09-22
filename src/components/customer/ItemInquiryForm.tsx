"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { submitItemInquiryAction, type FormActionResult } from "@/server/actions/customer";

const fieldClass = "antika-field";

export function ItemInquiryForm({
  itemId,
  title,
  reference,
  identity,
}: {
  itemId: string;
  title: string;
  reference: string;
  identity?: { name: string; email: string; phone?: string | null } | null;
}) {
  const [state, action, pending] = useActionState<FormActionResult | null, FormData>(
    submitItemInquiryAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="mt-10 border-y border-line py-8">
        <p className="font-serif text-2xl">Вашето барање е испратено.</p>
        <p className="mt-3 text-sm leading-7 text-muted">Ќе ве контактираме во најкраток можен рок.</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-10 space-y-5 border-y border-line py-8">
      <h2 className="font-serif text-2xl leading-tight">Заинтересиран сум за овој предмет</h2>
      <p className="text-sm text-muted">
        {title} · {reference}
      </p>
      <input type="hidden" name="itemId" value={itemId} />
      <label className="sr-only">
        Мрежно место
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" />
      </label>
      {identity ? (
        <>
          <input type="hidden" name="name" value={identity.name} />
          <input type="hidden" name="email" value={identity.email} />
          <p className="text-sm text-muted">
            {identity.name}
            <br />
            {identity.email}
          </p>
        </>
      ) : (
        <>
          <label className="block text-sm">
            Име
            <input name="name" required maxLength={80} className={fieldClass} />
          </label>
          <label className="block text-sm">
            Е-пошта
            <input name="email" type="email" required maxLength={120} className={fieldClass} />
          </label>
        </>
      )}
      <label className="block text-sm">
        Телефон
        <input name="phone" maxLength={30} defaultValue={identity?.phone ?? ""} className={fieldClass} />
      </label>
      <label className="block text-sm">
        Порака
        <textarea name="message" required minLength={10} maxLength={2000} rows={5} className={fieldClass} />
      </label>
      {state && !state.ok ? <p className="text-sm text-walnut">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Се испраќа…" : "Испрати барање"}
      </Button>
    </form>
  );
}
