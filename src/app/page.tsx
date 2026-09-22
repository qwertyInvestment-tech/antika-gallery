import { CollectionShowcase } from "@/components/home/CollectionShowcase";
import { FeaturedObject } from "@/components/home/FeaturedObject";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { Introduction } from "@/components/home/Introduction";
import { NewAcquisitions } from "@/components/home/NewAcquisitions";
import { StoriesSection } from "@/components/home/StoriesSection";
import { WantedObject } from "@/components/home/WantedObject";
import { SiteShell } from "@/components/layout/SiteShell";
import { primaryImage } from "@/lib/catalog/present";
import { getFeaturedItems, getPublicCategories, getRecentPublicItems } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featured = null;
  let acquisitions: Awaited<ReturnType<typeof getRecentPublicItems>> = [];
  let categories: Awaited<ReturnType<typeof getPublicCategories>> = [];

  try {
    const [featuredItems, recentItems, publicCategories] = await Promise.all([
      getFeaturedItems(1),
      getRecentPublicItems(4),
      getPublicCategories(),
    ]);
    featured = featuredItems[0] ?? null;
    acquisitions = recentItems;
    categories = publicCategories;
  } catch {
    featured = null;
    acquisitions = [];
    categories = [];
  }

  // Prefer curated catalogue titles; skip noisy QA labels only.
  const isNoisyQa = (title: string) => /\bQA\b/i.test(title) || /^test$/i.test(title.trim());
  const featuredForDisplay = featured && !isNoisyQa(featured.title) ? featured : null;
  const featuredPhoto = featuredForDisplay ? primaryImage(featuredForDisplay) : null;
  const heroMedia =
    featuredPhoto?.src != null
      ? { src: featuredPhoto.src, alt: featuredPhoto.alt }
      : null;

  const acquisitionItems = acquisitions.filter((item) => !isNoisyQa(item.title)).slice(0, 3);

  return (
    <SiteShell>
      <Hero image={heroMedia ?? undefined} />
      <Introduction />
      <FeaturedObject item={featuredForDisplay} />
      <CollectionShowcase categories={categories} />
      <NewAcquisitions items={acquisitionItems} />
      <StoriesSection />
      <WantedObject />
      <FinalCta />
    </SiteShell>
  );
}
