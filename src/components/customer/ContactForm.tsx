"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { submitContactAction, type FormActionResult } from "@/server/actions/customer";

const fieldClass = "antika-field";

export function ContactForm() {
  const [state, action, pending] = useActionState<FormActionResult | null, FormData>(
    submitContactAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="border border-line p-5">
        <p className="font-serif text-2xl">Вашето барање е испратено.</p>
        <p className="mt-3 text-sm leading-7 text-muted">Ќе ве контактираме во најкраток можен рок.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 border border-line p-5">
      <label className="sr-only">
        Мрежно место
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" />
      </label>
      <label className="block text-sm">
        Име
        <input name="name" required maxLength={80} className={fieldClass} />
      </label>
      <label className="block text-sm">
        Е-пошта
        <input name="email" type="email" required maxLength={120} className={fieldClass} />
      </label>
      <label className="block text-sm">
        Телефон
        <input name="phone" maxLength={30} className={fieldClass} />
      </label>
      <label className="block text-sm">
        Порака
        <textarea name="message" required minLength={10} maxLength={2000} rows={5} className={fieldClass} />
      </label>
      {state && !state.ok ? <p className="text-sm text-walnut">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Се испраќа…" : "Испрати порака"}
      </Button>
    </form>
  );
}
