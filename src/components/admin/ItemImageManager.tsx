"use client";

import { MediaKind } from "@prisma/client";
import { upload as uploadToBlob } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  removeItemImageAction,
  reorderItemImagesAction,
  setPrimaryImageAction,
  updateImageAltAction,
} from "@/server/actions/items";
import { toPublicImageSrc } from "@/lib/catalog/media";
import { MAX_IMAGES_PER_ITEM, MAX_VIDEOS_PER_ITEM } from "@/lib/media/limits";

type MediaRow = {
  id: string;
  isPrimary: boolean;
  sortOrder: number;
  asset: {
    url: string;
    alt: string | null;
    kind: MediaKind;
    mimeType?: string;
    durationSeconds?: number | null;
  };
};

type UploadMode = "local" | "blob";

export function ItemImageManager({
  itemId,
  images,
  uploadMode = "local",
}: {
  itemId: string;
  images: MediaRow[];
  uploadMode?: UploadMode;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const ordered = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const imageCount = ordered.filter((row) => row.asset.kind === MediaKind.IMAGE).length;
  const videoCount = ordered.filter((row) => row.asset.kind === MediaKind.VIDEO).length;

  async function run(result: Promise<{ ok: boolean; message?: string }>) {
    const next = await result;
    setMessage(next.ok ? "Ажурирано." : next.message ?? "Грешка.");
    if (next.ok) router.refresh();
  }

  async function uploadLocal(formData: FormData) {
    formData.set("itemId", itemId);
    const response = await fetch("/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });
    return (await response.json()) as { ok: boolean; message?: string };
  }

  async function uploadBlob(file: File, alt: string) {
    const prepareResponse = await fetch("/api/admin/media/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    });
    const prepared = (await prepareResponse.json()) as {
      ok: boolean;
      message?: string;
      mode?: UploadMode;
      pathname?: string;
      handleUploadUrl?: string;
    };
    if (!prepared.ok) {
      return { ok: false, message: prepared.message ?? "Грешка при прикачување." };
    }
    if (prepared.mode !== "blob" || !prepared.pathname || !prepared.handleUploadUrl) {
      return uploadLocal(
        (() => {
          const formData = new FormData();
          formData.set("file", file);
          formData.set("alt", alt);
          return formData;
        })(),
      );
    }

    const blob = await uploadToBlob(prepared.pathname, file, {
      access: "public",
      handleUploadUrl: prepared.handleUploadUrl,
      multipart: file.size > 4.5 * 1024 * 1024,
      clientPayload: JSON.stringify({
        itemId,
        alt,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    });

    const completeResponse = await fetch("/api/admin/media/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId,
        key: prepared.pathname,
        url: blob.url,
        mimeType: file.type,
        sizeBytes: file.size,
        alt,
      }),
    });
    return (await completeResponse.json()) as { ok: boolean; message?: string };
  }

  async function upload(formData: FormData) {
    if (uploading) return;
    setUploading(true);
    setMessage(null);
    try {
      const file = formData.get("file");
      const alt = String(formData.get("alt") ?? "");
      if (!(file instanceof File) || file.size === 0) {
        setMessage("Изберете датотека.");
        return;
      }

      const payload =
        uploadMode === "blob" ? await uploadBlob(file, alt) : await uploadLocal(formData);
      setMessage(payload.ok ? "Медиумот е додаден." : payload.message ?? "Грешка при прикачување.");
      if (payload.ok) router.refresh();
    } catch {
      setMessage("Грешка при прикачување.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl">Медиуми</h2>
        <p className="mt-1 text-sm text-muted">
          Фотографии: {imageCount}/{MAX_IMAGES_PER_ITEM} (до 30 MB) · Видеа: {videoCount}/{MAX_VIDEOS_PER_ITEM}{" "}
          (до 200 MB)
        </p>
      </div>
      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <form
        className="flex flex-col gap-3 border border-line p-4 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          void upload(new FormData(form)).then(() => form.reset());
        }}
      >
        <label className="block flex-1 text-sm">
          Датотека
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            required
            className="mt-1 block"
          />
        </label>
        <label className="block flex-1 text-sm">
          Опис / alt
          <input name="alt" className="mt-1 w-full border border-ink/15 bg-ivory-soft px-3 py-2" />
        </label>
        <button
          type="submit"
          disabled={uploading}
          className="border border-ink px-4 py-2 text-[0.72rem] tracking-[0.14em] uppercase disabled:opacity-50"
        >
          {uploading ? "Се прикачува…" : "Додај"}
        </button>
      </form>

      <ul className="space-y-4">
        {ordered.map((image, index) => {
          const src = toPublicImageSrc(image.asset.url) ?? "";
          const isVideo = image.asset.kind === MediaKind.VIDEO;
          return (
            <li key={image.id} className="flex flex-col gap-3 border border-line p-3 sm:flex-row">
              {isVideo ? (
                <video
                  src={src}
                  className="h-28 w-40 bg-ink/5 object-cover"
                  controls
                  preload="metadata"
                  muted
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={image.asset.alt ?? ""} className="h-28 w-28 object-cover" />
              )}
              <div className="flex-1 space-y-2">
                <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                  {isVideo
                    ? `Видео${image.asset.durationSeconds ? ` · ${image.asset.durationSeconds}s` : ""}`
                    : image.isPrimary
                      ? "Главна фотографија"
                      : `Фото · ред ${index + 1}`}
                </p>
                <form
                  className="flex gap-2"
                  action={async (formData) => {
                    await run(updateImageAltAction(itemId, image.id, String(formData.get("alt") ?? "")));
                  }}
                >
                  <input
                    name="alt"
                    defaultValue={image.asset.alt ?? ""}
                    className="flex-1 border border-ink/15 bg-ivory-soft px-3 py-2 text-sm"
                  />
                  <button type="submit" className="text-xs uppercase tracking-wider">
                    Опис
                  </button>
                </form>
                <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wider">
                  {!isVideo && !image.isPrimary ? (
                    <button type="button" onClick={() => run(setPrimaryImageAction(itemId, image.id))}>
                      Постави главна
                    </button>
                  ) : null}
                  {index > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const ids = ordered.map((row) => row.id);
                        [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                        void run(reorderItemImagesAction(itemId, ids));
                      }}
                    >
                      Нагоре
                    </button>
                  ) : null}
                  {index < ordered.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const ids = ordered.map((row) => row.id);
                        [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
                        void run(reorderItemImagesAction(itemId, ids));
                      }}
                    >
                      Надолу
                    </button>
                  ) : null}
                  <button type="button" onClick={() => run(removeItemImageAction(itemId, image.id))}>
                    Отстрани
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
