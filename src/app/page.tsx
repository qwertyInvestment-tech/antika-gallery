import { CollectionShowcase } from "@/components/home/CollectionShowcase";
import { FeaturedObject } from "@/components/home/FeaturedObject";
import { Hero } from "@/components/home/Hero";
import { NewAcquisitions } from "@/components/home/NewAcquisitions";
import { Philosophy } from "@/components/home/Philosophy";
import { StoriesSection } from "@/components/home/StoriesSection";
import { WantedObject } from "@/components/home/WantedObject";
import { SiteShell } from "@/components/layout/SiteShell";
import { getFeaturedItems, getPublicCategories, getRecentPublicItems } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featured = null;
  let acquisitions: Awaited<ReturnType<typeof getRecentPublicItems>> = [];
  let categories: Awaited<ReturnType<typeof getPublicCategories>> = [];

  try {
    const [featuredItems, recentItems, publicCategories] = await Promise.all([
      getFeaturedItems(1),
      getRecentPublicItems(3),
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

  return (
    <SiteShell>
      <Hero />
      <FeaturedObject item={featured} />
      <CollectionShowcase categories={categories} />
      <NewAcquisitions items={acquisitions} />
      <StoriesSection />
      <WantedObject />
      <Philosophy />
    </SiteShell>
  );
}
