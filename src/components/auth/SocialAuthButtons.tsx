import Link from "next/link";
import { SocialProvider } from "@prisma/client";
import { getConfiguredSocialProviders, socialProviderLabel } from "@/lib/auth/oauth-config";

function startHref(provider: SocialProvider, mode: "login" | "link", next?: string) {
  const slug = provider === SocialProvider.GOOGLE ? "google" : "facebook";
  const params = new URLSearchParams({ mode });
  if (next) params.set("next", next);
  return `/api/auth/oauth/${slug}/start?${params.toString()}`;
}

export function SocialAuthButtons({
  mode = "login",
  next,
  labelPrefix = "Продолжи со",
}: {
  mode?: "login" | "link";
  next?: string;
  labelPrefix?: string;
}) {
  const providers = getConfiguredSocialProviders();
  if (providers.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.18em] text-muted">
        <span className="h-px flex-1 bg-line" />
        или
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-col gap-3">
        {providers.map((provider) => (
          <Link
            key={provider}
            href={startHref(provider, mode, next)}
            className="border border-ink px-4 py-2 text-center text-[0.72rem] tracking-[0.14em] uppercase"
          >
            {labelPrefix} {socialProviderLabel(provider)}
          </Link>
        ))}
      </div>
    </div>
  );
}
