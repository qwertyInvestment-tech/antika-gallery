import { Container } from "@/components/ui/Container";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { LinkButton } from "@/components/ui/LinkButton";
import { mockHeroImage } from "@/content/mock/homepage";
import { publicPaths } from "@/lib/i18n/routes";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <Container width="wide" className="grid items-end gap-12 py-16 md:grid-cols-12 md:py-24 lg:py-28">
        <div className="md:col-span-5 lg:col-span-5">
          <p className="text-[0.72rem] tracking-[0.32em] uppercase text-muted">ANTIKA</p>
          <h1 className="mt-6 font-serif text-5xl font-medium leading-[0.95] tracking-tight sm:text-6xl lg:text-[5.4rem]">
            Предмети со историја.
          </h1>
          <p className="mt-8 max-w-md text-[1.05rem] leading-8 text-muted">
            Избрани антиквитети, колекционерски предмети и реткости — секој со своја приказна.
          </p>
          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <LinkButton href={publicPaths.collection}>Истражи ја колекцијата</LinkButton>
            <LinkButton href={publicPaths.requestItem} variant="secondary">
              Побарај предмет
            </LinkButton>
          </div>
        </div>
        <div className="md:col-span-7 lg:col-span-7">
          <ImageFrame
            src={mockHeroImage.src}
            alt={mockHeroImage.alt}
            caption={mockHeroImage.caption}
            priority
            className="aspect-[5/4] md:aspect-[16/11] md:translate-x-4 lg:translate-x-8"
            sizes="(min-width: 768px) 55vw, 100vw"
          />
        </div>
      </Container>
    </section>
  );
}
