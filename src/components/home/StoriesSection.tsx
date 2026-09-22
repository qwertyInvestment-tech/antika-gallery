import { StoryCard } from "@/components/editorial/StoryCard";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { publicPaths, storyPath } from "@/lib/i18n/routes";
import { getPublishedStories } from "@/server/stories/queries";

export async function StoriesSection() {
  let stories: Awaited<ReturnType<typeof getPublishedStories>> = [];
  try {
    stories = await getPublishedStories(3);
  } catch {
    stories = [];
  }

  if (stories.length === 0) {
    return null;
  }

  const [featured, ...others] = stories.map((story) => ({
    title: story.title,
    excerpt: story.excerpt ?? "",
    href: storyPath(story.slug),
    image: {
      src: story.coverImage?.url ?? "/mock/book.png",
      alt: story.coverImage?.alt ?? story.title,
    },
  }));

  return (
    <section className="border-t border-line bg-parchment/40 py-24 md:py-32 lg:py-36">
      <Container width="wide" className="lg:px-12">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Читалиште</p>
        <h2 className="mt-5 font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[0.95]">Приказни</h2>
        <p className="mt-6 max-w-lg text-[1.05rem] leading-8 text-muted">
          Кратки текстови околу предмети, материјали и начинот на кој се гледаат.
        </p>
        <div className="mt-16 md:mt-20">
          {featured ? <StoryCard {...featured} featured /> : null}
          {others.length > 0 ? (
            <div className="mt-16 grid gap-12 border-t border-line pt-16 md:grid-cols-2 md:gap-16">
              {others.map((story) => (
                <StoryCard key={story.href} {...story} />
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-16">
          <LinkButton href={publicPaths.stories} variant="secondary">
            Сите приказни
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
