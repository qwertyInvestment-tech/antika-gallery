"use client";

import { useState } from "react";
import { ImageFrame } from "@/components/ui/ImageFrame";

type GalleryImage = { src: string; alt: string };

export function ItemGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [touchX, setTouchX] = useState<number | null>(null);
  const current = images[index] ?? images[0];

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
        className="block w-full text-left"
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
          className="aspect-[4/5] md:aspect-[5/6]"
          sizes="(min-width: 1024px) 55vw, 100vw"
          priority
        />
      </button>

      {images.length > 1 ? (
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((image, imageIndex) => (
            <li key={`${image.src}-${imageIndex}`}>
              <button
                type="button"
                onClick={() => setIndex(imageIndex)}
                aria-current={imageIndex === index}
                aria-label={`Фотографија ${imageIndex + 1}`}
                className={`block w-20 shrink-0 border ${imageIndex === index ? "border-ink" : "border-transparent"}`}
              >
                <ImageFrame src={image.src} alt={image.alt} className="aspect-square min-h-20" sizes="80px" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/88 p-4"
          onClick={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "ArrowRight") go(index + 1);
            if (event.key === "ArrowLeft") go(index - 1);
          }}
        >
          <button type="button" className="absolute right-5 top-5 text-[0.72rem] tracking-[0.16em] uppercase text-ivory-soft">
            Затвори
          </button>
          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <ImageFrame src={current.src} alt={current.alt} className="h-full" sizes="90vw" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
