const API_MEDIA_PREFIX = "/api/media";

function stripLeadingSlash(value: string) {
  return value.replace(/^\/+/, "");
}

export function mediaPathFromKey(key: string) {
  const normalized = stripLeadingSlash(key.replaceAll("\\", "/"));
  const encoded = normalized
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${API_MEDIA_PREFIX}/${encoded}`;
}

/**
 * Resolve stored MediaAsset.url / storage keys to a same-origin path.
 * LOCAL files are served by `/api/media/[...key]`. Absolute localhost or
 * `/media/...` URLs from older records are rewritten so the origin/port
 * of the running server does not matter (Vercel, reverse proxy, :3006).
 * External CDN URLs are left unchanged.
 */
export function toPublicImageSrc(url: string | null | undefined) {
  if (!url) return null;
  const value = url.trim();
  if (!value) return null;
  if (value.startsWith("/mock/")) return value;
  if (value.startsWith(`${API_MEDIA_PREFIX}/`)) return value;
  if (value.startsWith("/media/")) {
    return mediaPathFromKey(value.slice("/media/".length));
  }
  if (!value.includes("://") && !value.startsWith("/")) {
    return mediaPathFromKey(value);
  }

  try {
    const parsed = new URL(value);
    if (parsed.pathname.startsWith(`${API_MEDIA_PREFIX}/`)) {
      return `${parsed.pathname}${parsed.search}`;
    }
    if (parsed.pathname.startsWith("/media/")) {
      return mediaPathFromKey(parsed.pathname.slice("/media/".length));
    }
    if (parsed.pathname.startsWith("/mock/")) {
      return parsed.pathname;
    }
    return value;
  } catch {
    return value;
  }
}
