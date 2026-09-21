import Image from "next/image";

type ImageFrameProps = {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  caption?: string;
};

export function ImageFrame({
  src,
  alt,
  className = "",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  caption,
}: ImageFrameProps) {
  return (
    <figure className={`group ${className}`}>
      <div className="relative h-full min-h-48 overflow-hidden bg-parchment">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center px-6 text-center text-[0.72rem] tracking-[0.18em] uppercase text-muted">
            Фотографијата не е достапна
          </div>
        )}
      </div>
      {caption ? (
        <figcaption className="mt-3 text-[0.72rem] tracking-[0.16em] uppercase text-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
