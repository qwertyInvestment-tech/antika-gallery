import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ImageFrame } from "@/components/ui/ImageFrame";

type ItemPreviewProps = {
  title: string;
  meta: string;
  status: string;
  href: string;
  image: { src: string | null; alt: string };
  price?: string;
  reference?: string;
  tone?: "default" | "sold" | "quiet";
  featured?: boolean;
  retired?: boolean;
};

export function ItemPreview({
  title,
  meta,
  status,
  href,
  image,
  price,
  reference,
  tone = "default",
  featured = false,
  retired = false,
}: ItemPreviewProps) {
  return (
    <Link href={href} className={`group block ${retired ? "opacity-75" : ""}`}>
      <ImageFrame
        src={image.src ?? ""}
        alt={image.alt}
        className={featured ? "aspect-[4/5] md:aspect-[16/10] md:min-h-[min(70vh,40rem)] md:[&>div]:min-h-[min(70vh,40rem)]" : "aspect-[4/5]"}
        sizes={featured ? "(min-width: 768px) 80vw, 100vw" : "(min-width: 768px) 36vw, 100vw"}
      />
      <div className={featured ? "mt-7" : "mt-5"}>
        <Badge tone={tone}>{status}</Badge>
        <h3
          className={`mt-3 font-serif leading-tight transition-opacity duration-300 group-hover:opacity-70 ${featured ? "text-3xl md:text-4xl" : "text-2xl"}`}
        >
          {title}
        </h3>
        {reference ? (
          <p className="mt-2 text-[0.68rem] tracking-[0.2em] uppercase text-muted">{reference}</p>
        ) : null}
        {meta ? <p className="mt-2 text-sm tracking-wide text-muted">{meta}</p> : null}
        {price ? <p className="mt-3 text-sm tracking-wide text-muted">{price}</p> : null}
      </div>
    </Link>
  );
}
