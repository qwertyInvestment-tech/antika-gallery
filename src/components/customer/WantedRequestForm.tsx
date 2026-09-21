"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { submitWantedRequestAction, type FormActionResult } from "@/server/actions/customer";

const fieldClass = "mt-1 w-full border border-ink/15 bg-ivory-soft px-3 py-2.5 text-sm";

export function WantedRequestForm({
  invert = false,
  identity,
}: {
  invert?: boolean;
  identity?: { name: string; email: string; phone?: string | null } | null;
}) {
  const [state, action, pending] = useActionState<FormActionResult | null, FormData>(
    submitWantedRequestAction,
    null,
  );
  const box = invert ? "border-ivory-soft/20 text-ivory-soft" : "border-line";
  const input = invert
    ? "mt-1 w-full border border-ivory-soft/20 bg-walnut-deep px-3 py-2.5 text-sm text-ivory-soft"
    : fieldClass;

  if (state?.ok) {
    return (
      <div className={`p-5 ${box} border`}>
        <p className="font-serif text-2xl">Вашето барање е испратено.</p>
        <p className={`mt-3 text-sm leading-7 ${invert ? "text-ivory-soft/70" : "text-muted"}`}>
          Ќе ве контактираме во најкраток можен рок.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className={`space-y-4 border p-5 ${box}`}>
      <label className="sr-only">
        Мрежно место
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" />
      </label>
      {identity ? (
        <>
          <input type="hidden" name="name" value={identity.name} />
          <input type="hidden" name="email" value={identity.email} />
          <p className="text-sm opacity-80">
            {identity.name}
            <br />
            {identity.email}
          </p>
        </>
      ) : (
        <>
          <label className="block text-sm">
            Име
            <input name="name" required maxLength={80} className={input} />
          </label>
          <label className="block text-sm">
            Е-пошта
            <input name="email" type="email" required maxLength={120} className={input} />
          </label>
        </>
      )}
      <label className="block text-sm">
        Телефон
        <input name="phone" maxLength={30} defaultValue={identity?.phone ?? ""} className={input} />
      </label>
      <label className="block text-sm">
        Што барате?
        <textarea name="description" required minLength={10} maxLength={1000} rows={4} className={input} />
      </label>
      <label className="block text-sm">
        Дополнителни детали
        <textarea name="details" maxLength={2000} rows={3} className={input} />
      </label>
      {state && !state.ok ? <p className="text-sm text-walnut">{state.message}</p> : null}
      <Button type="submit" disabled={pending} className={invert ? "border-ivory-soft text-ivory-soft" : ""}>
        {pending ? "Се испраќа…" : "Испрати барање"}
      </Button>
    </form>
  );
}
