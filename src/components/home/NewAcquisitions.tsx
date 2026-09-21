import { ItemPreview } from "@/components/editorial/ItemPreview";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { mockAcquisitions } from "@/content/mock/homepage";
import { toPreviewModel } from "@/lib/catalog/present";
import type { PublicCatalogItem } from "@/server/catalog/queries";

export function NewAcquisitions({ items = [] }: { items?: PublicCatalogItem[] }) {
  const previews = items.length > 0 ? items.map(toPreviewModel) : null;

  return (
    <Section>
      <Container width="wide">
        <SectionHeading eyebrow="Неодамна" title="Нови аквизиции" />
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-14">
          {previews
            ? previews.map((item) => <ItemPreview key={item.id} {...item} />)
            : mockAcquisitions.map((item) => <ItemPreview key={item.title} {...item} />)}
        </div>
      </Container>
    </Section>
  );
}
