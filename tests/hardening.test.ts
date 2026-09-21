import assert from "node:assert/strict";
import { test } from "node:test";
import { headerSafePath, isHttpHeaderSafe } from "../src/lib/i18n/redirect";
import { publicPaths } from "../src/lib/i18n/routes";
import { matchesDeclaredImageType } from "../src/lib/security/image-bytes";

test("Server Action redirect paths are ASCII-safe HTTP header values", () => {
  const targets = [
    publicPaths.profile,
    publicPaths.login,
    publicPaths.register,
    publicPaths.myOrders,
    publicPaths.myReservations,
    `${publicPaths.myOrders}/abc`,
    `${publicPaths.login}?next=${publicPaths.profile}`,
    publicPaths.admin,
  ];
  for (const target of targets) {
    const encoded = headerSafePath(target);
    assert.equal(isHttpHeaderSafe(encoded), true);
    assert.equal(encoded.startsWith("/"), true);
  }
  assert.notEqual(headerSafePath(publicPaths.profile), publicPaths.profile);
  assert.equal(decodeURI(headerSafePath(publicPaths.profile)), publicPaths.profile);
});

test("raw Macedonian path is not a valid HTTP header value", () => {
  assert.equal(isHttpHeaderSafe(publicPaths.profile), false);
  assert.equal(isHttpHeaderSafe("/admin"), true);
});

test("image magic bytes reject mismatched MIME types", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
  const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
  assert.equal(matchesDeclaredImageType(jpeg, "image/jpeg"), true);
  assert.equal(matchesDeclaredImageType(png, "image/png"), true);
  assert.equal(matchesDeclaredImageType(jpeg, "image/png"), false);
  assert.equal(matchesDeclaredImageType(exe, "image/jpeg"), false);
});

test("video magic bytes accept MP4 ftyp and reject garbage", async () => {
  const { matchesDeclaredVideoType } = await import("../src/lib/security/media-bytes");
  const mp4 = Buffer.alloc(16);
  mp4.write("ftyp", 4);
  assert.equal(matchesDeclaredVideoType(mp4, "video/mp4"), true);
  assert.equal(matchesDeclaredVideoType(Buffer.alloc(16), "video/mp4"), false);
});

test("public media URLs are same-origin and ignore localhost ports", async () => {
  const { toPublicImageSrc } = await import("../src/lib/catalog/media");
  assert.equal(
    toPublicImageSrc("http://localhost:3000/media/items/abc/photo.png"),
    "/api/media/items/abc/photo.png",
  );
  assert.equal(
    toPublicImageSrc("http://127.0.0.1:3006/media/items/abc/photo.png"),
    "/api/media/items/abc/photo.png",
  );
  assert.equal(toPublicImageSrc("/media/items/abc/photo.png"), "/api/media/items/abc/photo.png");
  assert.equal(toPublicImageSrc("/api/media/items/abc/photo.png"), "/api/media/items/abc/photo.png");
  assert.equal(toPublicImageSrc("items/abc/photo.png"), "/api/media/items/abc/photo.png");
  assert.equal(toPublicImageSrc("https://cdn.example.com/x.jpg"), "https://cdn.example.com/x.jpg");
});

test("admin search tokenizes punctuation and Macedonian words", async () => {
  const { tokenizeAdminSearch } = await import("../src/lib/catalog/admin-search");
  assert.deepEqual(tokenizeAdminSearch("QA ANTIKA ADMIN"), ["QA", "ANTIKA", "ADMIN"]);
  assert.deepEqual(tokenizeAdminSearch("QA — ANTIKA"), ["QA", "ANTIKA"]);
  assert.deepEqual(tokenizeAdminSearch("сребрен привезок"), ["сребрен", "привезок"]);
});

test("reservation remaining time is human-readable and TTL-agnostic", async () => {
  const { formatReservationRemaining } = await import("../src/lib/domain/reservation-status");
  const now = new Date("2026-09-20T12:00:00");
  assert.equal(formatReservationRemaining(new Date("2026-09-20T11:00:00"), now), "Истечена");
  assert.match(formatReservationRemaining(new Date("2026-09-20T18:40:00"), now), /Истекува денес во/);
  assert.equal(formatReservationRemaining(new Date("2026-09-21T19:42:00"), now), "Истекува за 31ч 42мин");
});
