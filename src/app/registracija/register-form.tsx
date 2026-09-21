"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { registerAction, type ActionResult } from "@/server/actions/auth";
import { publicPaths } from "@/lib/i18n/routes";

const initial: ActionResult | null = null;
const field = "border border-ink/20 bg-ivory-soft px-3 py-2 text-base outline-none focus:border-ink";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial);

  return (
    <form action={formAction} className="mt-10 flex w-full max-w-sm flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm">
        Име
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={field} />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        Е-пошта
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        Телефон
        <input name="phone" maxLength={30} autoComplete="tel" className={field} />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        Лозинка
        <input name="password" type="password" required minLength={10} autoComplete="new-password" className={field} />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        Потврда на лозинка
        <input name="confirmPassword" type="password" required minLength={10} autoComplete="new-password" className={field} />
      </label>
      {state && !state.ok ? <p className="text-sm text-walnut">{state.message}</p> : null}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Се создава сметка…" : "Создај сметка"}
      </Button>
      <p className="text-sm text-muted">
        Веќе имате сметка?{" "}
        <Link href={publicPaths.login} className="underline underline-offset-4">
          Најава
        </Link>
      </p>
    </form>
  );
}
