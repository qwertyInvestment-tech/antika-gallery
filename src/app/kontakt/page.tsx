import { ContactForm } from "@/components/customer/ContactForm";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { publicPaths } from "@/lib/i18n/routes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Контакт — ANTIKA",
  description: "Пишете ни за колекцијата, предмет или барање.",
};

export default function ContactPage() {
  return (
    <SiteShell>
      <Container width="narrow" className="py-16 md:py-24">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Контакт</p>
        <h1 className="mt-4 font-serif text-5xl">Пишете ни.</h1>
        <p className="mt-6 text-lg leading-8 text-muted">
          За конкретен предмет користете го барањето на неговата страница. Ако барате нешто што го нема во
          колекцијата, опишете го преку „Побарај предмет“.
        </p>
        <LinkButton href={publicPaths.requestItem} variant="secondary" className="mt-8">
          Побарај предмет
        </LinkButton>
        <div className="mt-12">
          <ContactForm />
        </div>
      </Container>
    </SiteShell>
  );
}
