import Link from "next/link";
import { ImageFrame } from "@/components/ui/ImageFrame";

type CollectionTileProps = {
  name: string;
  href: string;
  image?: { src: string; alt: string } | null;
  size?: "large" | "medium" | "wide" | "small" | "type";
};

const sizeClass = {
  large: "md:col-span-7 md:row-span-2 min-h-[28rem]",
  medium: "md:col-span-5 min-h-[16rem]",
  wide: "md:col-span-8 min-h-[18rem]",
  small: "md:col-span-4 min-h-[16rem]",
  type: "md:col-span-4 min-h-[16rem]",
};

export function CollectionTile({ name, href, image, size = "medium" }: CollectionTileProps) {
  if (size === "type" || !image) {
    return (
      <Link
        href={href}
        className={`group flex flex-col justify-end border border-ink/10 bg-walnut-deep p-8 text-ivory-soft ${sizeClass[size]}`}
      >
        <p className="text-[0.68rem] tracking-[0.28em] uppercase text-ivory-soft/45">Категорија</p>
        <h3 className="mt-4 font-serif text-3xl leading-tight transition-opacity duration-300 group-hover:opacity-80 md:text-4xl">
          {name}
        </h3>
      </Link>
    );
  }

  return (
    <Link href={href} className={`group relative block ${sizeClass[size]}`}>
      <ImageFrame src={image.src} alt={image.alt} className="absolute inset-0 h-full [&>div]:h-full" sizes="(min-width: 768px) 50vw, 100vw" />
      <div className="absolute inset-x-0 bottom-0 bg-ink/65 px-6 py-5 md:px-8 md:py-6">
        <p className="text-[0.68rem] tracking-[0.24em] uppercase text-ivory-soft/70">Категорија</p>
        <h3 className="mt-2 font-serif text-2xl text-ivory-soft md:text-3xl">{name}</h3>
      </div>
    </Link>
  );
}
