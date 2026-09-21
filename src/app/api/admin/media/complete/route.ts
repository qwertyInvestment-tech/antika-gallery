import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { isAppError, toErrorResponse } from "@/lib/errors";
import { registerBlobMedia } from "@/server/services/item-image-service";

export const runtime = "nodejs";

/** Admin-only: persist MediaAsset after a successful direct Blob upload. */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    if (env.STORAGE_PROVIDER !== "BLOB") {
      return NextResponse.json({ ok: false, message: "Blob складирањето не е активно." }, { status: 400 });
    }

    const body = (await request.json()) as {
      itemId?: string;
      key?: string;
      url?: string;
      mimeType?: string;
      sizeBytes?: number;
      alt?: string;
      durationSeconds?: number | null;
    };

    const media = await registerBlobMedia({
      itemId: String(body.itemId ?? ""),
      key: String(body.key ?? ""),
      url: String(body.url ?? ""),
      mimeType: String(body.mimeType ?? ""),
      sizeBytes: Number(body.sizeBytes ?? 0),
      alt: body.alt,
      durationSeconds: body.durationSeconds ?? null,
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
