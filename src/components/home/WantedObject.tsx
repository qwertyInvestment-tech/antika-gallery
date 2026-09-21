import { WantedRequestForm } from "@/components/customer/WantedRequestForm";
import { getSessionUser } from "@/lib/auth/session";
import { getPublicAccount } from "@/server/services/account-service";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export async function WantedObject() {
  const session = await getSessionUser();
  const account = session ? await getPublicAccount(session.id) : null;
  return (
    <Section tone="walnut" className="py-24 md:py-32">
      <Container width="narrow" className="text-center">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-ivory-soft/50">Побарај предмет</p>
        <h2 className="mt-6 font-serif text-4xl leading-tight md:text-6xl">Барате нешто посебно?</h2>
        <p className="mx-auto mt-8 max-w-lg text-base leading-8 text-ivory-soft/70">
          Кажете ни што барате. Можеби следниот предмет во вашата колекција веќе постои — само треба да го
          пронајдеме.
        </p>
        <div className="mx-auto mt-10 max-w-lg text-left">
          <WantedRequestForm
            invert
            identity={account ? { name: account.name, email: account.email, phone: account.phone } : null}
          />
        </div>
      </Container>
    </Section>
  );
}
