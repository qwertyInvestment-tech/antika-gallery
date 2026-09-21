import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { SiteShell } from "@/components/layout/SiteShell";
import { publicPaths } from "@/lib/i18n/routes";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <SiteShell>
      <Container width="narrow" className="py-24 md:py-32">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">ANTIKA</p>
        <h1 className="mt-6 font-serif text-5xl leading-tight">{title}</h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-muted">{description}</p>
        <LinkButton href={publicPaths.home} variant="secondary" className="mt-10">
          Назад кон почетна
        </LinkButton>
      </Container>
    </SiteShell>
  );
}
