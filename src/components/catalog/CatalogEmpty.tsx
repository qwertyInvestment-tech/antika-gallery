import { LinkButton } from "@/components/ui/LinkButton";
import { publicPaths } from "@/lib/i18n/routes";

export function CatalogEmpty({
  title = "Во оваа збирка моментално нема предмети.",
  description = "Колекцијата се менува предмет по предмет. Можеби следното што го барате е во друг простор.",
  cta = "Погледнете ја целата колекција",
}: {
  title?: string;
  description?: string;
  cta?: string;
}) {
  return (
    <div className="max-w-xl py-10">
      <h2 className="font-serif text-3xl leading-tight">{title}</h2>
      <p className="mt-4 text-base leading-8 text-muted">{description}</p>
      <LinkButton href={publicPaths.collection} variant="secondary" className="mt-8">
        {cta}
      </LinkButton>
    </div>
  );
}
