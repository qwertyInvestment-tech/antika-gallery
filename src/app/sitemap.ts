import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { categoryPath, itemPath, publicPaths } from "@/lib/i18n/routes";
import { listPublicSitemapEntries } from "@/server/catalog/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { items, categories } = await listPublicSitemapEntries();
  const staticRoutes = [
    publicPaths.home,
    publicPaths.collection,
    publicPaths.categories,
    publicPaths.search,
    publicPaths.requestItem,
    publicPaths.contact,
    publicPaths.stories,
    publicPaths.about,
  ];

  return [
    ...staticRoutes.map((path) => ({
      url: new URL(path, env.APP_URL).toString(),
      changeFrequency: "weekly" as const,
    })),
    ...categories.map((category) => ({
      url: new URL(categoryPath(category.slug), env.APP_URL).toString(),
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
    })),
    ...items.map((item) => ({
      url: new URL(itemPath(item.slug), env.APP_URL).toString(),
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
    })),
  ];
}
