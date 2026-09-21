import { WantedRequestForm } from "@/components/customer/WantedRequestForm";
import { getSessionUser } from "@/lib/auth/session";
import { getPublicAccount } from "@/server/services/account-service";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Побарај предмет — ANTIKA",
  description: "Опишете го предметот што го барате. Ќе ве контактираме ако се појави соодветен примерок.",
};

export default async function WantedPage() {
  const session = await getSessionUser();
  const account = session ? await getPublicAccount(session.id) : null;

  return (
    <SiteShell>
      <Container width="narrow" className="py-16 md:py-24">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Побарај предмет</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight">Барате нешто посебно?</h1>
        <p className="mt-6 text-lg leading-8 text-muted">
          Ова не е нарачка за предмет од колекцијата. Кажете ни што барате — период, материјал, карактер — и ќе
          внимаваме кога ќе се појави соодветен примерок.
        </p>
        <div className="mt-10">
          <WantedRequestForm
            identity={account ? { name: account.name, email: account.email, phone: account.phone } : null}
          />
        </div>
      </Container>
    </SiteShell>
  );
}
