"use server";

import { headers } from "next/headers";
import { getSessionUser, requireAdmin, requireSession } from "@/lib/auth/session";
import { toErrorResponse } from "@/lib/errors";
import { InquiryStatus, ItemRequestStatus } from "@prisma/client";
import { inquiryStatusSchema } from "@/lib/validation/inquiry";
import { requestStatusSchema } from "@/lib/validation/request";
import {
  changeInquiryStatus,
  createItemInquiry,
  getInquiryById,
} from "@/server/services/inquiry-service";
import {
  changeWantedRequestStatus,
  createContactMessage,
  createWantedRequest,
} from "@/server/services/request-service";
import { getPublicItemsByIds } from "@/server/catalog/queries";
import {
  addFavoriteForUser,
  listFavoriteItems,
  mergeAnonymousFavorites,
  removeFavoriteForUser,
} from "@/server/services/favorite-service";
import { revalidatePath } from "next/cache";

export type FormActionResult = { ok: true } | { ok: false; message: string };

function honeypot(formData: FormData) {
  return String(formData.get("website") ?? "").trim().length > 0;
}

async function clientKey(kind: string) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `${kind}:${ip}`;
}

export async function submitItemInquiryAction(
  _prev: FormActionResult | null,
  formData: FormData,
): Promise<FormActionResult> {
  try {
    if (honeypot(formData)) return { ok: true };
    const session = await getSessionUser();
    await createItemInquiry(
      {
        itemId: formData.get("itemId"),
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone") || "",
        message: formData.get("message"),
      },
      await clientKey("inquiry"),
      session?.id,
    );
    return { ok: true };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function submitWantedRequestAction(
  _prev: FormActionResult | null,
  formData: FormData,
): Promise<FormActionResult> {
  try {
    if (honeypot(formData)) return { ok: true };
    const session = await getSessionUser();
    await createWantedRequest(
      {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone") || "",
        description: formData.get("description"),
        details: formData.get("details") || "",
      },
      await clientKey("wanted"),
      session?.id,
    );
    return { ok: true };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function submitContactAction(
  _prev: FormActionResult | null,
  formData: FormData,
): Promise<FormActionResult> {
  try {
    if (honeypot(formData)) return { ok: true };
    await createContactMessage({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || "",
      message: formData.get("message"),
    });
    return { ok: true };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function loadFavoriteItemsAction(ids: string[]) {
  return getPublicItemsByIds(ids);
}

export async function loadMyFavoritesAction() {
  const session = await getSessionUser();
  if (!session) return [];
  return listFavoriteItems(session.id);
}

export async function toggleFavoriteAction(itemId: string, saved: boolean): Promise<FormActionResult> {
  try {
    const user = await requireSession();
    if (saved) await removeFavoriteForUser(user.id, itemId);
    else await addFavoriteForUser(user.id, itemId);
    revalidatePath("/omileni");
    return { ok: true };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function mergeFavoritesAction(itemIds: string[]): Promise<FormActionResult> {
  try {
    const user = await requireSession();
    await mergeAnonymousFavorites(user.id, itemIds);
    revalidatePath("/omileni");
    return { ok: true };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function changeInquiryStatusAction(id: string, status: string): Promise<FormActionResult> {
  try {
    await requireAdmin();
    const parsed = inquiryStatusSchema.safeParse(status);
    if (!parsed.success) return { ok: false, message: "Невалиден статус." };
    await changeInquiryStatus(id, parsed.data as InquiryStatus);
    revalidatePath("/admin/inquiries");
    revalidatePath(`/admin/inquiries/${id}`);
    return { ok: true };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function changeWantedRequestStatusAction(id: string, status: string): Promise<FormActionResult> {
  try {
    await requireAdmin();
    const parsed = requestStatusSchema.safeParse(status);
    if (!parsed.success) return { ok: false, message: "Невалиден статус." };
    await changeWantedRequestStatus(id, parsed.data as ItemRequestStatus);
    revalidatePath("/admin/requests");
    revalidatePath(`/admin/requests/${id}`);
    return { ok: true };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function getInquiryAdminAction(id: string) {
  await requireAdmin();
  return getInquiryById(id);
}
