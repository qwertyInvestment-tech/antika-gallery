import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { isAppError, toErrorResponse } from "@/lib/errors";
import { addItemMedia } from "@/server/services/item-image-service";

export const runtime = "nodejs";

/** Local large-file upload path (images ≤30MB, videos ≤200MB). Prefer this over Server Actions. */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const itemId = String(formData.get("itemId") ?? "");
    const file = formData.get("file");
    const alt = String(formData.get("alt") ?? "");
    const durationRaw = formData.get("durationSeconds");
    const durationSeconds =
      typeof durationRaw === "string" && durationRaw.trim()
        ? Number.parseInt(durationRaw, 10)
        : null;

    if (!itemId) {
      return NextResponse.json({ ok: false, message: "Недостасува предмет." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, message: "Изберете датотека." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const media = await addItemMedia({
      itemId,
      buffer,
      mimeType: file.type,
      sizeBytes: file.size,
      alt,
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
    });

    return NextResponse.json({
      ok: true,
      id: media.id,
      kind: media.asset.kind,
      url: media.asset.url,
    });
  } catch (error) {
    const result = toErrorResponse(error);
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code },
      { status: isAppError(error) ? error.status : result.status },
    );
  }
}
