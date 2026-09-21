import { redirect } from "@/lib/i18n/redirect";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";
import { publicPaths } from "@/lib/i18n/routes";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { RegisterForm } from "./register-form";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user && isAdminRole(user.role)) redirect(publicPaths.admin);
  if (user) redirect(publicPaths.profile);

  return (
    <SiteShell>
      <Container width="narrow" className="py-24 md:py-32">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">ANTIKA</p>
        <h1 className="mt-6 font-serif text-5xl tracking-tight">Регистрација</h1>
        <p className="mt-4 max-w-md text-muted">Создајте сметка за да ги зачувате омилените и да ги следите нарачките.</p>
        <RegisterForm />
        <div className="mt-2 max-w-sm">
          <SocialAuthButtons mode="login" labelPrefix="Продолжи со" />
        </div>
      </Container>
    </SiteShell>
  );
}
