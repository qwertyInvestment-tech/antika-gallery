import { redirect as nextRedirect } from "next/navigation";

/**
 * RFC 9110 HTTP header values must be ASCII. Next.js Server Actions copy the
 * redirect destination into `x-action-redirect`. Raw Macedonian pathnames
 * (e.g. `/мој-профил`) throw `ERR_INVALID_CHAR` and abort the response.
 *
 * Percent-encoding keeps the public Macedonian URL after the browser decodes
 * Location, while the header itself stays ASCII-safe.
 */
export function headerSafePath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return encodeURI(path);
}

export function isHttpHeaderSafe(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code > 0x7e) return false;
  }
  return true;
}

export function redirect(path: string): never {
  nextRedirect(headerSafePath(path));
}
