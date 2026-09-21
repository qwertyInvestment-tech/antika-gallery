import { ItemRequestStatus, InquiryStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";
import { assertRequestStatusTransition } from "@/lib/domain/request-status";
import { contactMessageSchema, wantedRequestSchema } from "@/lib/validation/request";
import { assertNotDuplicate, assertRateLimit } from "@/lib/security/rate-limit";

export async function createWantedRequest(raw: unknown, key = "wanted", userId?: string | null) {
  const parsed = wantedRequestSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      parsed.error.issues[0]?.message ?? "Податоците не се валидни.",
      400,
    );
  }
  const input = parsed.data;
  if (!assertRateLimit(`${key}:${input.email.toLowerCase()}`)) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Почекајте пред да испратите повторно.", 429);
  }
  if (!assertNotDuplicate(`${input.email.toLowerCase()}:${input.description}`)) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Ова барање веќе е испратено.", 429);
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

  return prisma.itemRequest.create({
    data: {
      userId: ownerId,
      name,
      email,
      phone,
      description: input.description,
      details: input.details?.trim() || null,
      status: ItemRequestStatus.NEW,
    },
  });
}

export async function createContactMessage(raw: unknown) {
  const parsed = contactMessageSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      parsed.error.issues[0]?.message ?? "Податоците не се валидни.",
      400,
    );
  }
  const input = parsed.data;
  if (!assertRateLimit(`contact:${input.email.toLowerCase()}`)) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Почекајте пред да испратите повторно.", 429);
  }

  return prisma.inquiry.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone?.trim() || null,
      message: input.message,
      status: InquiryStatus.NEW,
    },
  });
}

export async function listWantedRequests(query: { q?: string; status?: ItemRequestStatus }) {
  return prisma.itemRequest.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { email: { contains: query.q, mode: "insensitive" } },
              { description: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWantedRequestById(id: string) {
  return prisma.itemRequest.findUnique({ where: { id } });
}

export async function changeWantedRequestStatus(id: string, status: ItemRequestStatus) {
  const existing = await prisma.itemRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Барањето не е пронајдено.", 404);
  }
  assertRequestStatusTransition(existing.status, status);
  return prisma.itemRequest.update({ where: { id }, data: { status } });
}
