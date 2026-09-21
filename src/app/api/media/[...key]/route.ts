import { NextResponse } from "next/server";
import { getObjectStorage } from "@/lib/storage";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  const storageKey = key.join("/");
  const stored = await getObjectStorage().get(storageKey);
  if (!stored) {
    return NextResponse.json({ ok: false, message: "Датотеката не е пронајдена." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(stored.body), {
    headers: {
      "Content-Type": stored.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
