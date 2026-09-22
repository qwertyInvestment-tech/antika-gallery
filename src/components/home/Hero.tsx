import Image from "next/image";
import { LinkButton } from "@/components/ui/LinkButton";
import { mockHeroImage, mockFeatured } from "@/content/mock/homepage";
import { publicPaths } from "@/lib/i18n/routes";

type HeroProps = {
  image?: { src: string; alt: string } | null;
};

export function Hero({ image }: HeroProps) {
  // Prefer a strong local editorial photograph for the first viewport.
  const media =
    image?.src && !image.src.includes("QA")
      ? image
      : { src: mockFeatured.image.src, alt: mockFeatured.image.alt || mockHeroImage.alt };

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#1a1410] text-ivory-soft">
      <div className="antika-hero-media absolute inset-0">
        <Image
          src={media.src}
          alt={media.alt}
          fill
          priority
          sizes="100vw"
          className="scale-105 object-cover object-[center_30%] md:object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#1a1410]/82 via-[#1a1410]/35 to-transparent max-md:via-[#1a1410]/55"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/75 via-transparent to-[#1a1410]/30"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[92rem] flex-col justify-end px-5 pb-16 pt-28 sm:px-8 md:justify-center md:pb-24 md:pt-32 lg:px-12">
        <div className="antika-hero-copy max-w-3xl md:max-w-4xl">
          <p className="text-[0.72rem] tracking-[0.4em] uppercase text-ivory-soft/70">ANTIKA</p>
          <h1 className="mt-6 font-serif font-medium leading-[0.86] tracking-tight text-[clamp(3.5rem,10vw,9rem)]">
            Предмети
            <br />
            со историја.
          </h1>
          <p className="mt-8 max-w-md text-[1.08rem] leading-8 text-ivory-soft/78 md:text-lg">
            Избрани антиквитети и колекционерски предмети — секој со своја приказна.
          </p>
          <div className="mt-12">
            <LinkButton
              href={publicPaths.collection}
              className="border-ivory-soft/50 bg-ivory-soft/5 text-ivory-soft backdrop-blur-[2px] hover:border-ivory-soft hover:bg-ivory-soft/15"
            >
              Разгледај ја колекцијата
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
