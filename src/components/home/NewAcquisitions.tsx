import { ItemPreview } from "@/components/editorial/ItemPreview";
import { Container } from "@/components/ui/Container";
import { mockAcquisitions } from "@/content/mock/homepage";
import { toPreviewModel } from "@/lib/catalog/present";
import type { PublicCatalogItem } from "@/server/catalog/queries";

export function NewAcquisitions({ items = [] }: { items?: PublicCatalogItem[] }) {
  if (items.length > 0) {
    const previews = items.map(toPreviewModel);
    const [featured, ...rest] = previews;
    return (
      <section className="bg-ivory py-24 md:py-32 lg:py-36">
        <Container width="wide" className="lg:px-12">
          <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Неодамна</p>
          <h2 className="mt-5 max-w-2xl font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[0.95]">
            Нови аквизиции
          </h2>
          <p className="mt-6 max-w-lg text-[1.05rem] leading-8 text-muted">
            Нови предмети во колекцијата — прво се гледаат, потоа се читаат.
          </p>
          {featured ? (
            <div className="mt-16 md:mt-20">
              <ItemPreview {...featured} featured />
            </div>
          ) : null}
          {rest.length > 0 ? (
            <div className="mt-16 grid gap-14 sm:grid-cols-2 lg:mt-24 lg:gap-16">
              {rest.map((item) => (
                <ItemPreview key={item.id} {...item} />
              ))}
            </div>
          ) : null}
        </Container>
      </section>
    );
  }

  const [featured, ...rest] = mockAcquisitions;

  return (
    <section className="bg-ivory py-24 md:py-32 lg:py-36">
      <Container width="wide" className="lg:px-12">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Неодамна</p>
        <h2 className="mt-5 max-w-2xl font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[0.95]">
          Нови аквизиции
        </h2>
        <p className="mt-6 max-w-lg text-[1.05rem] leading-8 text-muted">
          Нови предмети во колекцијата — прво се гледаат, потоа се читаат.
        </p>
        {featured ? (
          <div className="mt-16 md:mt-20">
            <ItemPreview {...featured} featured />
          </div>
        ) : null}
        {rest.length > 0 ? (
          <div className="mt-16 grid gap-14 sm:grid-cols-2 lg:mt-24 lg:gap-16">
            {rest.map((item) => (
              <ItemPreview key={item.title} {...item} />
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
