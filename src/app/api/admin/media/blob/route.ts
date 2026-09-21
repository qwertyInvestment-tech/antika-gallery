import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdmin } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { isAppError, toErrorResponse } from "@/lib/errors";
import {
  assertMediaUploadAllowed,
  isValidItemMediaPathname,
  maxBytesForMime,
} from "@/server/services/item-image-service";

export const runtime = "nodejs";

type ClientPayload = {
  itemId?: string;
  mimeType?: string;
  sizeBytes?: number;
  alt?: string;
};

/**
 * Issues short-lived client tokens for direct browser → Vercel Blob uploads.
 * Does not accept file bodies (avoids Vercel body size limits for 30–200 MB media).
 */
export async function POST(request: Request) {
  if (env.STORAGE_PROVIDER !== "BLOB") {
    return NextResponse.json({ ok: false, message: "Blob складирањето не е активно." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      token: env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await requireAdmin();

        let payload: ClientPayload = {};
        try {
          payload = clientPayload ? (JSON.parse(clientPayload) as ClientPayload) : {};
        } catch {
          throw new Error("Невалидно барање.");
        }

        const itemId = String(payload.itemId ?? "");
        const mimeType = String(payload.mimeType ?? "").toLowerCase();
        const sizeBytes = Number(payload.sizeBytes ?? 0);

        if (!itemId || !mimeType || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
          throw new Error("Невалидно барање.");
        }
        if (!isValidItemMediaPathname(pathname, itemId)) {
          throw new Error("Невалиден пат за медиум.");
        }

        const allowed = await assertMediaUploadAllowed({ itemId, mimeType, sizeBytes });
        if (allowed.mimeType !== mimeType) {
          throw new Error("Невалиден тип на датотека.");
        }

        return {
          allowedContentTypes: [mimeType],
          maximumSizeInBytes: maxBytesForMime(mimeType),
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            itemId,
            mimeType,
            sizeBytes,
            alt: payload.alt ?? "",
            pathname,
          }),
        };
      },
      onUploadCompleted: async () => {
        // Metadata is committed via /api/admin/media/complete so localhost and production share one path.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const result = toErrorResponse(error);
    return NextResponse.json(
      { ok: false, message: result.message, error: result.message },
      { status: isAppError(error) ? error.status : 400 },
    );
  }
}
