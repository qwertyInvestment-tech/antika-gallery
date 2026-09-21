"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SocialProvider } from "@prisma/client";
import { unlinkSocialProviderAction } from "@/server/actions/auth";

type IdentityRow = {
  id: string;
  provider: SocialProvider;
  email: string | null;
};

function label(provider: SocialProvider) {
  return provider === SocialProvider.GOOGLE ? "Google" : "Facebook";
}

function startLinkHref(provider: SocialProvider) {
  const slug = provider === SocialProvider.GOOGLE ? "google" : "facebook";
  return `/api/auth/oauth/${slug}/start?mode=link`;
}

export function LoginMethodsPanel({
  hasPassword,
  identities,
  availableProviders,
}: {
  hasPassword: boolean;
  identities: IdentityRow[];
  availableProviders: SocialProvider[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const linked = new Set(identities.map((row) => row.provider));
  const canUnlink = (provider: SocialProvider) => {
    const remaining = identities.filter((row) => row.provider !== provider).length;
    return hasPassword || remaining > 0;
  };

  async function unlink(provider: SocialProvider) {
    if (pending) return;
    setPending(provider);
    setMessage(null);
    try {
      const result = await unlinkSocialProviderAction(provider);
      setMessage(result.ok ? "Отстрането." : result.message);
      if (result.ok) router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="mt-14 space-y-5 border-t border-line pt-10">
      <h2 className="font-serif text-3xl">Начини на најавување</h2>
      <ul className="space-y-3 text-sm">
        <li className="flex flex-wrap items-center justify-between gap-3">
          <span>Е-пошта и лозинка</span>
          <span className="text-muted">{hasPassword ? "Поврзано" : "Не е поставено"}</span>
        </li>
        {identities.map((identity) => (
          <li key={identity.id} className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {label(identity.provider)}
              {identity.email ? ` · ${identity.email}` : ""}
            </span>
            {canUnlink(identity.provider) ? (
              <button
                type="button"
                disabled={pending !== null}
                className="text-[0.68rem] uppercase tracking-wider text-walnut disabled:opacity-50"
                onClick={() => void unlink(identity.provider)}
              >
                {pending === identity.provider ? "Се обработува…" : "Отстрани"}
              </button>
            ) : (
              <span className="text-muted">Единствен начин</span>
            )}
          </li>
        ))}
      </ul>

      {availableProviders.some((provider) => !linked.has(provider)) ? (
        <div>
          <p className="mb-3 text-sm text-muted">Поврзете дополнителен начин на најавување.</p>
          <div className="flex flex-col gap-3 sm:max-w-xs">
            {availableProviders
              .filter((provider) => !linked.has(provider))
              .map((provider) => (
                <a
                  key={provider}
                  href={startLinkHref(provider)}
                  className="border border-ink px-4 py-2 text-center text-[0.72rem] tracking-[0.14em] uppercase"
                >
                  Поврзи {label(provider)}
                </a>
              ))}
          </div>
        </div>
      ) : null}

      {availableProviders.length === 0 ? (
        <p className="text-sm text-muted">
          Google и Facebook најавувањето ќе се прикаже кога ќе се конфигурираат provider credentials.
        </p>
      ) : null}

      {message ? <p className="text-sm text-walnut">{message}</p> : null}
    </section>
  );
}
