import { StoryCard } from "@/components/editorial/StoryCard";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";
import { storyPath } from "@/lib/i18n/routes";
import { getPublishedStories } from "@/server/stories/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Приказни — ANTIKA",
  description: "Уреднички текстови за предмети, материјали и начинот на кој се гледа колекцијата.",
};

export default async function StoriesPage() {
  const stories = await getPublishedStories();

  return (
    <SiteShell>
      <Container width="wide" className="py-16 md:py-24">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Читалиште</p>
        <h1 className="mt-5 max-w-4xl font-serif text-[clamp(2.75rem,7vw,6.5rem)] font-medium leading-[0.92]">
          Приказни
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-8 text-muted">
          Кратки уреднички текстови околу предмети, материјали и начинот на кој се гледаат — без измислена
          провениенција и без бучен маркетинг јазик.
        </p>

        {stories.length === 0 ? (
          <p className="mt-16 text-muted">Моментално нема објавени приказни.</p>
        ) : (
          <div className="mt-16 grid gap-14 sm:grid-cols-2 lg:mt-20 lg:gap-16">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                title={story.title}
                excerpt={story.excerpt ?? ""}
                href={storyPath(story.slug)}
                image={{
                  src: story.coverImage?.url ?? "/mock/book.png",
                  alt: story.coverImage?.alt ?? story.title,
                }}
              />
            ))}
          </div>
        )}
      </Container>
    </SiteShell>
  );
}
