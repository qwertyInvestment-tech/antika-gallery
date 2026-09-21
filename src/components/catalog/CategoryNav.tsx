import Link from "next/link";
import { catalogHref } from "@/lib/catalog/public-query";
import { publicPaths } from "@/lib/i18n/routes";

type CategoryOption = { slug: string; name: string };

export function CategoryNav({
  categories,
  activeSlug,
}: {
  categories: CategoryOption[];
  activeSlug?: string;
}) {
  return (
    <nav aria-label="Категории" className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
      <ul className="flex min-w-max gap-5 pb-1 text-[0.72rem] tracking-[0.16em] uppercase sm:flex-wrap">
        <li>
          <Link
            href={publicPaths.collection}
            className={!activeSlug ? "text-ink" : "text-muted hover:text-ink"}
            aria-current={!activeSlug ? "page" : undefined}
          >
            Сите
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={catalogHref(publicPaths.collection, { categorySlug: category.slug, sort: "newest", page: 1, pageSize: 8 })}
              className={activeSlug === category.slug ? "text-ink" : "text-muted hover:text-ink"}
              aria-current={activeSlug === category.slug ? "page" : undefined}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
