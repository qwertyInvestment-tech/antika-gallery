import Link from "next/link";
import { ImageFrame } from "@/components/ui/ImageFrame";

type StoryCardProps = {
  title: string;
  excerpt: string;
  href: string;
  image: { src: string; alt: string };
  featured?: boolean;
};

export function StoryCard({ title, excerpt, href, image, featured = false }: StoryCardProps) {
  if (featured) {
    return (
      <Link href={href} className="group grid gap-6 md:grid-cols-12 md:gap-10">
        <ImageFrame
          src={image.src}
          alt={image.alt}
          className="aspect-[16/11] md:col-span-7 md:aspect-[4/3]"
          sizes="(min-width: 768px) 55vw, 100vw"
        />
        <div className="flex flex-col justify-end md:col-span-5 md:pb-4">
          <p className="text-[0.68rem] tracking-[0.24em] uppercase text-muted">Приказна</p>
          <h3 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">{title}</h3>
          <p className="mt-4 max-w-sm text-[1.05rem] leading-8 text-muted">{excerpt}</p>
          <span className="mt-6 text-[0.75rem] tracking-[0.16em] uppercase text-ink underline decoration-rule underline-offset-8 transition-colors duration-300 group-hover:decoration-ink">
            Читај
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group grid grid-cols-[5.5rem_1fr] gap-5 sm:grid-cols-[7rem_1fr]">
      <ImageFrame
        src={image.src}
        alt={image.alt}
        className="aspect-square"
        sizes="112px"
      />
      <div className="self-center">
        <h3 className="font-serif text-2xl leading-snug">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-muted">{excerpt}</p>
      </div>
    </Link>
  );
}
