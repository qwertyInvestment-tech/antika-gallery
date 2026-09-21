import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { isAppError, toErrorResponse } from "@/lib/errors";
import { prepareBlobMediaUpload } from "@/server/services/item-image-service";

export const runtime = "nodejs";

/** Admin-only: allocate a storage pathname before direct Blob upload. */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    if (env.STORAGE_PROVIDER !== "BLOB") {
      return NextResponse.json({
        ok: true,
        mode: "local" as const,
      });
    }

    const body = (await request.json()) as {
      itemId?: string;
      mimeType?: string;
      sizeBytes?: number;
    };

    const prepared = await prepareBlobMediaUpload({
      itemId: String(body.itemId ?? ""),
      mimeType: String(body.mimeType ?? ""),
      sizeBytes: Number(body.sizeBytes ?? 0),
    });

    return NextResponse.json({
      ok: true,
      mode: "blob" as const,
      pathname: prepared.pathname,
      mimeType: prepared.mimeType,
      kind: prepared.kind,
      maxBytes: prepared.maxBytes,
      handleUploadUrl: "/api/admin/media/blob",
    });
  } catch (error) {
    const result = toErrorResponse(error);
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code },
      { status: isAppError(error) ? error.status : result.status },
    );
  }
}
