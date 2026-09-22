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
      <Container width="wide" className="py-16 md:py-24 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Контакт</p>
            <h1 className="mt-5 font-serif text-5xl leading-tight md:text-6xl">Пишете ни.</h1>
            <p className="mt-8 max-w-md text-lg leading-8 text-muted">
              За конкретен предмет користете го барањето на неговата страница. Ако барате нешто што го нема во
              колекцијата, опишете го преку „Побарај предмет“.
            </p>
            <LinkButton href={publicPaths.requestItem} variant="secondary" className="mt-10">
              Побарај предмет
            </LinkButton>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <ContactForm />
          </div>
        </div>
      </Container>
    </SiteShell>
  );
}
