import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { publicPaths } from "@/lib/i18n/routes";

export default function NotFound() {
  return (
    <SiteShell>
      <Container width="narrow" className="py-24 md:py-32">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">ANTIKA</p>
        <h1 className="mt-6 font-serif text-5xl leading-tight">Страницата не е пронајдена.</h1>
        <p className="mt-6 text-lg leading-8 text-muted">
          Предметот или категоријата што ја барате не постојат, или повеќе не се јавно видливи.
        </p>
        <LinkButton href={publicPaths.collection} className="mt-10">
          Погледнете ја целата колекција
        </LinkButton>
      </Container>
    </SiteShell>
  );
}
