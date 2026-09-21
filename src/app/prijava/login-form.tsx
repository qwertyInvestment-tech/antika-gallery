"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { loginAction, type ActionResult } from "@/server/actions/auth";
import { publicPaths } from "@/lib/i18n/routes";

const initial: ActionResult | null = null;

const ERROR_MESSAGES: Record<string, string> = {
  oauth: "Најавувањето не успеа. Обидете се повторно.",
  "link-required":
    "Постои сметка со истата е-пошта. Најавете се со лозинка за безбедно поврзување.",
};

export function LoginForm({ next, error }: { next?: string; error?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const oauthMessage = error ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.oauth : null;

  return (
    <form action={formAction} className="mt-10 flex w-full max-w-sm flex-col gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label className="flex flex-col gap-2 text-sm">
        Е-пошта
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="border border-ink/20 bg-ivory-soft px-3 py-2 text-base outline-none focus:border-ink"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        Лозинка
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="border border-ink/20 bg-ivory-soft px-3 py-2 text-base outline-none focus:border-ink"
        />
      </label>
      {oauthMessage ? <p className="text-sm text-walnut">{oauthMessage}</p> : null}
      {state && !state.ok ? <p className="text-sm text-walnut">{state.message}</p> : null}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Се најавувате…" : "Најави се"}
      </Button>
      <p className="text-sm text-muted">
        Немате сметка?{" "}
        <Link href={publicPaths.register} className="underline underline-offset-4">
          Регистрација
        </Link>
      </p>
    </form>
  );
}
