"use client";

import { useEffect, useState } from "react";
import { ImageFrame } from "@/components/ui/ImageFrame";

type GalleryImage = { src: string; alt: string };

export function ItemGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [touchX, setTouchX] = useState<number | null>(null);
  const current = images[index] ?? images[0];

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") setIndex((value) => (value + 1) % images.length);
      if (event.key === "ArrowLeft") setIndex((value) => (value - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (!current) {
    return (
      <ImageFrame src="" alt={title} className="aspect-[4/5]" sizes="(min-width: 1024px) 55vw, 100vw" />
    );
  }

  function go(next: number) {
    if (images.length === 0) return;
    setIndex((next + images.length) % images.length);
  }

  return (
    <div>
      <button
        type="button"
        className="group block w-full text-left"
        onClick={() => setOpen(true)}
        onTouchStart={(event) => setTouchX(event.changedTouches[0]?.clientX ?? null)}
        onTouchEnd={(event) => {
          if (touchX == null) return;
          const delta = (event.changedTouches[0]?.clientX ?? touchX) - touchX;
          if (delta > 40) go(index - 1);
          if (delta < -40) go(index + 1);
          setTouchX(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") go(index + 1);
          if (event.key === "ArrowLeft") go(index - 1);
        }}
        aria-label="Зголеми ја фотографијата"
      >
        <ImageFrame
          src={current.src}
          alt={current.alt}
          className="aspect-[4/5] md:aspect-[5/6] md:min-h-[min(72vh,44rem)] md:[&>div]:min-h-[min(72vh,44rem)]"
          sizes="(min-width: 1024px) 60vw, 100vw"
          priority
        />
        <span className="mt-3 block text-[0.68rem] tracking-[0.18em] uppercase text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          Зголеми
        </span>
      </button>

      {images.length > 1 ? (
        <ul className="mt-5 flex gap-3 overflow-x-auto pb-1">
          {images.map((image, imageIndex) => (
            <li key={`${image.src}-${imageIndex}`}>
              <button
                type="button"
                onClick={() => setIndex(imageIndex)}
                aria-current={imageIndex === index ? "true" : undefined}
                aria-label={`Фотографија ${imageIndex + 1}`}
                className={`block w-[4.5rem] shrink-0 border transition-colors duration-300 sm:w-20 ${
                  imageIndex === index ? "border-ink" : "border-transparent hover:border-ink/30"
                }`}
              >
                <ImageFrame src={image.src} alt={image.alt} className="aspect-square min-h-[4.5rem]" sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="absolute right-5 top-5 min-h-11 px-3 text-[0.72rem] tracking-[0.16em] uppercase text-ivory-soft"
            onClick={() => setOpen(false)}
          >
            Затвори
          </button>
          <div className="relative h-[82vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <ImageFrame src={current.src} alt={current.alt} className="h-full" sizes="90vw" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
