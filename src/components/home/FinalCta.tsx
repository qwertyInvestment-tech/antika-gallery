import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { publicPaths } from "@/lib/i18n/routes";

export function FinalCta() {
  return (
    <section className="flex min-h-[min(62vh,34rem)] items-center border-t border-line bg-ivory py-28 md:py-36">
      <Container width="wide" className="text-center lg:px-12">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Колекцијата</p>
        <h2 className="mx-auto mt-8 max-w-4xl font-serif text-[clamp(2.5rem,5.5vw,5rem)] font-medium leading-[1.02]">
          Некои предмети не се купуваат.
          <br />
          Се пронаоѓаат.
        </h2>
        <div className="mt-12">
          <LinkButton href={publicPaths.collection}>Разгледај ја колекцијата</LinkButton>
        </div>
      </Container>
    </section>
  );
}
