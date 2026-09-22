import Link from "next/link";
import { ImageFrame } from "@/components/ui/ImageFrame";

type CollectionTileProps = {
  name: string;
  href: string;
  image?: { src: string; alt: string } | null;
  size?: "large" | "medium" | "wide" | "small" | "type";
  invert?: boolean;
};

const sizeClass = {
  large: "md:col-span-7 md:row-span-2 min-h-[22rem] md:min-h-[32rem]",
  medium: "md:col-span-5 min-h-[16rem] md:min-h-[18rem]",
  wide: "md:col-span-8 min-h-[16rem] md:min-h-[20rem]",
  small: "md:col-span-4 min-h-[14rem] md:min-h-[16rem]",
  type: "md:col-span-4 min-h-[14rem] md:min-h-[16rem]",
};

export function CollectionTile({
  name,
  href,
  image,
  size = "medium",
  invert = false,
}: CollectionTileProps) {
  if (size === "type" || !image) {
    return (
      <Link
        href={href}
        className={`group flex flex-col justify-end border p-8 transition-colors duration-300 ${sizeClass[size]} ${
          invert
            ? "border-ivory-soft/15 bg-ink/25 hover:border-ivory-soft/35"
            : "border-ink/10 bg-walnut-deep text-ivory-soft"
        }`}
      >
        <p
          className={`text-[0.68rem] tracking-[0.28em] uppercase ${invert ? "text-ivory-soft/45" : "text-ivory-soft/45"}`}
        >
          Категорија
        </p>
        <h3
          className={`mt-4 font-serif leading-tight transition-transform duration-500 group-hover:translate-x-1 ${
            invert ? "text-3xl text-ivory-soft md:text-4xl" : "text-3xl md:text-4xl"
          }`}
        >
          {name}
        </h3>
      </Link>
    );
  }

  return (
    <Link href={href} className={`group relative block overflow-hidden ${sizeClass[size]}`}>
      <ImageFrame
        src={image.src}
        alt={image.alt}
        className="absolute inset-0 h-full [&>div]:h-full"
        sizes="(min-width: 768px) 50vw, 100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-6 py-6 md:px-8 md:py-8">
        <p className="text-[0.68rem] tracking-[0.24em] uppercase text-ivory-soft/65">Категорија</p>
        <h3 className="mt-2 font-serif text-2xl text-ivory-soft transition-transform duration-500 group-hover:translate-x-1 md:text-3xl lg:text-4xl">
          {name}
        </h3>
      </div>
    </Link>
  );
}
