import { redirect } from "@/lib/i18n/redirect";
import { requireSession } from "@/lib/auth/session";
import { logoutAction } from "@/server/actions/auth";
import { getPublicAccount } from "@/server/services/account-service";
import { listLoginMethods } from "@/server/services/oauth-service";
import { getConfiguredSocialProviders } from "@/lib/auth/oauth-config";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { CustomerNav } from "@/components/customer/CustomerNav";
import { Button } from "@/components/ui/Button";
import { LoginMethodsPanel } from "@/components/auth/LoginMethodsPanel";
import { publicPaths } from "@/lib/i18n/routes";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireSession();
  const [account, methods] = await Promise.all([
    getPublicAccount(session.id),
    listLoginMethods(session.id),
  ]);
  if (!account) redirect(publicPaths.login);

  return (
    <SiteShell>
      <Container width="narrow" className="py-16 md:py-24">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Сметка</p>
        <h1 className="mt-4 font-serif text-5xl">Мој профил</h1>
        <CustomerNav />
        <dl className="mt-12 grid gap-6 text-sm">
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Име</dt>
            <dd className="mt-1">{account.name}</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Е-пошта</dt>
            <dd className="mt-1">{account.email}</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Телефон</dt>
            <dd className="mt-1">{account.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wider text-muted">Сметка од</dt>
            <dd className="mt-1">{account.createdAt.toLocaleDateString("mk-MK")}</dd>
          </div>
        </dl>

        {methods ? (
          <LoginMethodsPanel
            hasPassword={methods.hasPassword}
            identities={methods.identities}
            availableProviders={getConfiguredSocialProviders()}
          />
        ) : null}

        <form action={logoutAction} className="mt-12">
          <Button type="submit" variant="secondary">
            Одјави се
          </Button>
        </form>
      </Container>
    </SiteShell>
  );
}
