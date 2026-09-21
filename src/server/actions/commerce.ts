"use server";

import { FulfillmentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { toErrorResponse } from "@/lib/errors";
import { orderStatusSchema } from "@/lib/validation/commerce";
import {
  cancelReservation,
  changeOrderStatus,
  confirmSale,
  reserveItem,
  reverseSale,
} from "@/server/services/commerce-service";

export type CommerceActionResult = { ok: true; id?: string } | { ok: false; message: string };

function revalidateCommerce(itemId?: string, reservationId?: string, orderId?: string) {
  revalidatePath("/admin/items");
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/inquiries");
  if (itemId) revalidatePath(`/admin/items/${itemId}`);
  if (reservationId) revalidatePath(`/admin/reservations/${reservationId}`);
  if (orderId) revalidatePath(`/admin/orders/${orderId}`);
}

export async function reserveItemAction(
  _prev: CommerceActionResult | null,
  formData: FormData,
): Promise<CommerceActionResult> {
  try {
    const admin = await requireAdmin();
    const reservation = await reserveItem(
      {
        itemId: formData.get("itemId"),
        inquiryId: formData.get("inquiryId"),
        fulfillmentMethod: formData.get("fulfillmentMethod") || FulfillmentMethod.PICKUP,
        notes: formData.get("notes") || "",
      },
      admin.id,
    );
    revalidateCommerce(reservation.itemId, reservation.id);
    return { ok: true, id: reservation.id };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function cancelReservationAction(reservationId: string): Promise<CommerceActionResult> {
  try {
    const admin = await requireAdmin();
    const reservation = await cancelReservation(reservationId, admin.id);
    revalidateCommerce(reservation.itemId, reservation.id);
    return { ok: true, id: reservation.id };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function confirmSaleAction(reservationId: string): Promise<CommerceActionResult> {
  try {
    const admin = await requireAdmin();
    const result = await confirmSale(reservationId, admin.id);
    revalidateCommerce(result.reservation.itemId, result.reservation.id, result.order.id);
    return { ok: true, id: result.order.id };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function reverseSaleAction(orderId: string): Promise<CommerceActionResult> {
  try {
    const admin = await requireAdmin();
    const order = await reverseSale(orderId, admin.id);
    const itemId = order.items[0]?.itemId;
    revalidateCommerce(itemId, order.reservationId ?? undefined, order.id);
    return { ok: true, id: order.id };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function changeOrderStatusAction(orderId: string, status: string): Promise<CommerceActionResult> {
  try {
    await requireAdmin();
    const parsed = orderStatusSchema.safeParse(status);
    if (!parsed.success) return { ok: false, message: "Невалиден статус." };
    await changeOrderStatus(orderId, parsed.data);
    revalidateCommerce(undefined, undefined, orderId);
    return { ok: true, id: orderId };
  } catch (error) {
    return toErrorResponse(error);
  }
}
