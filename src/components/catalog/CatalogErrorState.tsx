import { LinkButton } from "@/components/ui/LinkButton";
import { publicPaths } from "@/lib/i18n/routes";

export function CatalogErrorState() {
  return (
    <div className="max-w-xl py-16">
      <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">ANTIKA</p>
      <h1 className="mt-5 font-serif text-4xl">Колекцијата моментално не може да се прикаже.</h1>
      <p className="mt-4 text-base leading-8 text-muted">Обидете се повторно за кратко. Предметите не се изгубени.</p>
      <LinkButton href={publicPaths.home} variant="secondary" className="mt-8">
        Назад кон почетна
      </LinkButton>
    </div>
  );
}
