import { ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const storyInclude = {
  coverImage: {
    select: { url: true, alt: true, width: true, height: true },
  },
} as const;

export async function getPublishedStories(take?: number) {
  return prisma.story.findMany({
    where: { status: ContentStatus.PUBLISHED },
    include: storyInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    ...(take ? { take } : {}),
  });
}

export async function getPublishedStoryBySlug(slug: string) {
  return prisma.story.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    include: storyInclude,
  });
}

export type PublicStory = Awaited<ReturnType<typeof getPublishedStories>>[number];
