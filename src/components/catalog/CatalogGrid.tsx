import { ItemPreview } from "@/components/editorial/ItemPreview";
import type { toPreviewModel } from "@/lib/catalog/present";

type Preview = ReturnType<typeof toPreviewModel>;

export function CatalogGrid({ items }: { items: Preview[] }) {
  if (items.length === 0) return null;

  const [first, ...rest] = items;

  return (
    <div className="space-y-20 md:space-y-28">
      <ItemPreview {...first} featured />

      {rest.length > 0 ? (
        <div className="grid gap-y-16 md:grid-cols-12 md:gap-x-8 md:gap-y-24">
          {rest.map((item, index) => {
            const pattern = index % 5;
            const wide = pattern === 0 || pattern === 3;
            const offset = pattern === 2;
            return (
              <div
                key={item.id}
                className={`${wide ? "md:col-span-7" : "md:col-span-5"} ${offset ? "md:col-start-2" : ""}`}
              >
                <ItemPreview {...item} />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
