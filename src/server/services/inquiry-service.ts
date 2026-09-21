import { InquiryStatus, ItemStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";
import { assertInquiryStatusTransition } from "@/lib/domain/inquiry-status";
import { isPurchasableStatus, isPubliclyVisibleStatus } from "@/lib/domain/item-status";
import { inquiryWriteSchema } from "@/lib/validation/inquiry";
import { assertNotDuplicate, assertRateLimit } from "@/lib/security/rate-limit";

function parseInquiry(raw: unknown) {
  const parsed = inquiryWriteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      parsed.error.issues[0]?.message ?? "Податоците не се валидни.",
      400,
    );
  }
  return parsed.data;
}

export async function createItemInquiry(raw: unknown, key = "inquiry", userId?: string | null) {
  const input = parseInquiry(raw);
  if (!assertRateLimit(`${key}:${input.email.toLowerCase()}`)) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Почекајте пред да испратите повторно.", 429);
  }
  const dup = `${input.email.toLowerCase()}:${input.itemId}:${input.message}`;
  if (!assertNotDuplicate(dup)) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Ова барање веќе е испратено.", 429);
  }

  const item = await prisma.item.findUnique({
    where: { id: input.itemId },
    select: { id: true, status: true, title: true, referenceNumber: true },
  });
  if (!item || !isPubliclyVisibleStatus(item.status)) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Предметот не е пронајден.", 404);
  }
  if (item.status === ItemStatus.ARCHIVED || item.status === ItemStatus.DRAFT) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Предметот не е пронајден.", 404);
  }
  if (!isPurchasableStatus(item.status)) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      item.status === ItemStatus.SOLD
        ? "Предметот е продаден и не се примаат нови барања."
        : "Предметот моментално не е достапен за барање.",
      400,
    );
  }

  let name = input.name;
  let email = input.email.toLowerCase();
  let phone = input.phone?.trim() || null;
  let ownerId: string | null = null;
  if (userId) {
    const owner = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    });
    if (owner) {
      ownerId = owner.id;
      name = owner.name;
      email = owner.email.toLowerCase();
      phone = input.phone?.trim() || owner.phone;
    }
  }

  return prisma.inquiry.create({
    data: {
      itemId: item.id,
      userId: ownerId,
      name,
      email,
      phone,
      message: input.message,
      status: InquiryStatus.NEW,
    },
  });
}

export async function listInquiries(query: { q?: string; status?: InquiryStatus }) {
  return prisma.inquiry.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { email: { contains: query.q, mode: "insensitive" } },
              { message: { contains: query.q, mode: "insensitive" } },
              { item: { title: { contains: query.q, mode: "insensitive" } } },
              { item: { referenceNumber: { contains: query.q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      item: { select: { id: true, title: true, referenceNumber: true, slug: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listInquiriesForItem(itemId: string) {
  return prisma.inquiry.findMany({
    where: { itemId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });
}

export async function getInquiryById(id: string) {
  return prisma.inquiry.findUnique({
    where: { id },
    include: {
      item: { select: { id: true, title: true, referenceNumber: true, slug: true, status: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function changeInquiryStatus(id: string, status: InquiryStatus) {
  const existing = await prisma.inquiry.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Барањето не е пронајдено.", 404);
  }
  assertInquiryStatusTransition(existing.status, status);
  return prisma.inquiry.update({ where: { id }, data: { status } });
}
