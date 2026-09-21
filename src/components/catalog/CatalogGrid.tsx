import { ItemPreview } from "@/components/editorial/ItemPreview";
import type { toPreviewModel } from "@/lib/catalog/present";

type Preview = ReturnType<typeof toPreviewModel>;

export function CatalogGrid({ items }: { items: Preview[] }) {
  if (items.length === 0) return null;

  const [first, ...rest] = items;

  return (
    <div className="space-y-16 md:space-y-24">
      <ItemPreview {...first} featured />

      {rest.length > 0 ? (
        <div className="grid gap-x-8 gap-y-14 md:grid-cols-12 md:gap-y-20">
          {rest.map((item, index) => {
            const wide = index % 5 === 0 || index % 5 === 3;
            return (
              <div key={item.id} className={wide ? "md:col-span-7" : "md:col-span-5"}>
                <ItemPreview {...item} />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
