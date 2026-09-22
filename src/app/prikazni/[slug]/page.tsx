import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { LinkButton } from "@/components/ui/LinkButton";
import { publicPaths } from "@/lib/i18n/routes";
import { renderStoryBody } from "@/lib/stories/render";
import { getPublishedStories, getPublishedStoryBySlug } from "@/server/stories/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);
  if (!story) return { title: "Приказна — ANTIKA" };
  return {
    title: `${story.title} — ANTIKA`,
    description: story.excerpt ?? story.title,
  };
}

export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);
  if (!story) notFound();

  const blocks = renderStoryBody(story.content);
  const cover = story.coverImage;

  return (
    <SiteShell>
      <article>
        <Container width="wide" className="py-12 md:py-20">
          <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Приказна</p>
          <h1 className="mt-5 max-w-4xl font-serif text-[clamp(2.4rem,6vw,5rem)] font-medium leading-[0.95]">
            {story.title}
          </h1>
          {story.excerpt ? (
            <p className="mt-8 max-w-2xl text-lg leading-8 text-muted">{story.excerpt}</p>
          ) : null}
        </Container>

        {cover?.url ? (
          <div className="w-full">
            <ImageFrame
              src={cover.url}
              alt={cover.alt ?? story.title}
              className="aspect-[16/10] w-full md:aspect-[21/9] md:min-h-[min(52vh,28rem)] md:[&>div]:min-h-[min(52vh,28rem)]"
              sizes="100vw"
            />
          </div>
        ) : null}

        <Container width="narrow" className="py-14 md:py-20">
          <div className="space-y-7">
            {blocks.map((block) =>
              block.type === "h2" ? (
                <h2 key={block.key} className="pt-4 font-serif text-3xl leading-tight md:text-4xl">
                  {block.text}
                </h2>
              ) : (
                <p key={block.key} className="text-[1.08rem] leading-8 text-charcoal/90">
                  {block.text}
                </p>
              ),
            )}
          </div>

          <div className="mt-16 border-t border-line pt-10">
            <LinkButton href={publicPaths.stories} variant="secondary">
              Назад кон приказните
            </LinkButton>
          </div>
        </Container>
      </article>
    </SiteShell>
  );
}

export async function generateStaticParams() {
  try {
    const stories = await getPublishedStories();
    return stories.map((story) => ({ slug: story.slug }));
  } catch {
    return [];
  }
}
