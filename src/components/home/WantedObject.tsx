import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { publicPaths } from "@/lib/i18n/routes";

/** Concierge band — CTA only; form lives on /побарај-предмет. */
export function WantedObject() {
  return (
    <section className="bg-ink py-28 text-ivory-soft md:min-h-[min(70vh,36rem)] md:py-36 lg:py-40">
      <Container width="wide" className="text-center lg:px-12">
        <p className="text-[0.72rem] tracking-[0.32em] uppercase text-ivory-soft/45">Приватна аквизиција</p>
        <h2 className="mx-auto mt-8 max-w-4xl font-serif text-[clamp(2.75rem,7vw,6rem)] font-medium leading-[0.94]">
          Барате нешто посебно?
        </h2>
        <p className="mx-auto mt-8 max-w-lg text-[1.05rem] leading-8 text-ivory-soft/60">
          Не го најдовте предметот што го барате? Кажете ни што барате. Ќе го побараме за вас.
        </p>
        <div className="mt-12">
          <LinkButton
            href={publicPaths.requestItem}
            className="border-ivory-soft/40 bg-transparent text-ivory-soft hover:border-ivory-soft hover:bg-ivory-soft/10"
          >
            Побарај предмет
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
