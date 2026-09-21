const JPEG = [0xff, 0xd8] as const;
const PNG = [0x89, 0x50, 0x4e, 0x47] as const;

export function matchesDeclaredImageType(body: Buffer, mimeType: string): boolean {
  if (body.length < 12) return false;
  if (mimeType === "image/jpeg") {
    return body[0] === JPEG[0] && body[1] === JPEG[1];
  }
  if (mimeType === "image/png") {
    return body[0] === PNG[0] && body[1] === PNG[1] && body[2] === PNG[2] && body[3] === PNG[3];
  }
  if (mimeType === "image/webp") {
    return body.toString("ascii", 0, 4) === "RIFF" && body.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}

/**
 * Basic container signature checks for accepted video MIME types.
 * MP4/ISOBMFF: "ftyp" at offset 4. WebM: EBML header 0x1A45DFA3.
 */
export function matchesDeclaredVideoType(body: Buffer, mimeType: string): boolean {
  if (body.length < 12) return false;
  if (mimeType === "video/mp4") {
    return body.toString("ascii", 4, 8) === "ftyp";
  }
  if (mimeType === "video/webm") {
    return body[0] === 0x1a && body[1] === 0x45 && body[2] === 0xdf && body[3] === 0xa3;
  }
  return false;
}

export function matchesDeclaredMediaType(body: Buffer, mimeType: string): boolean {
  if (mimeType.startsWith("image/")) return matchesDeclaredImageType(body, mimeType);
  if (mimeType.startsWith("video/")) return matchesDeclaredVideoType(body, mimeType);
  return false;
}
