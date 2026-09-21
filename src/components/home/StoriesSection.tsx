import { StoryCard } from "@/components/editorial/StoryCard";
import { Container } from "@/components/ui/Container";
import { Divider } from "@/components/ui/Divider";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { mockStories } from "@/content/mock/homepage";

export function StoriesSection() {
  const featured = mockStories.find((story) => story.featured);
  const others = mockStories.filter((story) => !story.featured);

  return (
    <Section>
      <Container width="wide">
        <SectionHeading eyebrow="Читалиште" title="Приказни" />
        <div className="mt-14">
          {featured ? <StoryCard {...featured} featured /> : null}
          <Divider className="my-12" soft />
          <div className="grid gap-10 md:grid-cols-2">
            {others.map((story) => (
              <StoryCard key={story.title} {...story} />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
