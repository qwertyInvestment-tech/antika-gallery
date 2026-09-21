"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { toErrorResponse } from "@/lib/errors";
import { itemStatusSchema } from "@/lib/validation/item";
import {
  archiveItem,
  bulkArchiveItems,
  bulkDeleteItems,
  changeItemStatus,
  createItem,
  deleteItem,
  updateItem,
} from "@/server/services/item-service";
import {
  addItemImage,
  removeItemImage,
  reorderItemImages,
  setPrimaryImage,
  updateImageAlt,
} from "@/server/services/item-image-service";

export type CatalogActionResult =
  | { ok: true; id?: string; archivedIds?: string[]; deletedIds?: string[] }
  | { ok: false; message: string };

function formObject(formData: FormData) {
  return {
    title: formData.get("title"),
    slug: formData.get("slug") || "",
    categoryId: formData.get("categoryId"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    price: formData.get("price"),
    currency: formData.get("currency") || "MKD",
    status: formData.get("status") || "DRAFT",
    periodLabel: formData.get("periodLabel"),
    origin: formData.get("origin"),
    maker: formData.get("maker"),
    provenance: formData.get("provenance"),
    material: formData.get("material"),
    condition: formData.get("condition") || null,
    conditionNotes: formData.get("conditionNotes"),
    dimensions: formData.get("dimensions"),
    weight: formData.get("weight"),
    authenticityNotes: formData.get("authenticityNotes"),
    documentationNotes: formData.get("documentationNotes"),
    expertNotes: formData.get("expertNotes"),
    certificateNotes: formData.get("certificateNotes"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
  };
}

export async function createItemAction(
  _prev: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    const item = await createItem(formObject(formData));
    revalidatePath("/admin/items");
    return { ok: true, id: item.id };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function updateItemAction(
  _prev: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") ?? "");
    const item = await updateItem(id, formObject(formData));
    revalidatePath("/admin/items");
    revalidatePath(`/admin/items/${item.id}`);
    return { ok: true, id: item.id };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function changeItemStatusAction(itemId: string, status: string): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    const parsed = itemStatusSchema.safeParse(status);
    if (!parsed.success) {
      return { ok: false, message: "Невалиден статус." };
    }
    await changeItemStatus(itemId, parsed.data);
    revalidatePath("/admin/items");
    revalidatePath(`/admin/items/${itemId}`);
    return { ok: true, id: itemId };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function archiveItemAction(itemId: string): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    await archiveItem(itemId);
    revalidatePath("/admin/items");
    revalidatePath(`/admin/items/${itemId}`);
    return { ok: true, id: itemId };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function deleteItemAction(itemId: string): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    await deleteItem(itemId);
    revalidatePath("/admin/items");
    return { ok: true, id: itemId };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function bulkArchiveItemsAction(itemIds: string[]): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    const result = await bulkArchiveItems(itemIds);
    revalidatePath("/admin/items");
    return { ok: true, archivedIds: result.archivedIds };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function bulkDeleteItemsAction(itemIds: string[]): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    const result = await bulkDeleteItems(itemIds);
    revalidatePath("/admin/items");
    return { ok: true, deletedIds: result.deletedIds };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function addItemImageAction(itemId: string, formData: FormData): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: "Изберете фотографија." };
    }
    await addItemImage(itemId, file, String(formData.get("alt") ?? ""));
    revalidatePath(`/admin/items/${itemId}`);
    return { ok: true, id: itemId };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function setPrimaryImageAction(itemId: string, imageId: string): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    await setPrimaryImage(itemId, imageId);
    revalidatePath(`/admin/items/${itemId}`);
    return { ok: true };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function updateImageAltAction(itemId: string, imageId: string, alt: string): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    await updateImageAlt(imageId, itemId, alt);
    revalidatePath(`/admin/items/${itemId}`);
    return { ok: true };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function reorderItemImagesAction(itemId: string, imageIds: string[]): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    await reorderItemImages(itemId, imageIds);
    revalidatePath(`/admin/items/${itemId}`);
    return { ok: true };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function removeItemImageAction(itemId: string, imageId: string): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    await removeItemImage(itemId, imageId);
    revalidatePath(`/admin/items/${itemId}`);
    return { ok: true };
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function markSoldAction() {
  return { ok: false as const, message: "Продажбата се финализира преку активна резервација." };
}
