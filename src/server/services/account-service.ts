import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { SessionUser } from "@/lib/auth/session-token";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

const publicUser = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  createdAt: true,
} as const;

export async function registerCustomer(raw: unknown) {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      parsed.error.issues[0]?.message ?? "Податоците не се валидни.",
      400,
    );
  }
  const input = parsed.data;
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new AppError(APP_ERROR_CODES.CONFLICT, "Веќе постои сметка со оваа е-пошта.", 409);
  }
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email,
        passwordHash,
        phone: input.phone?.trim() || null,
        role: UserRole.CUSTOMER,
        isActive: true,
      },
      select: publicUser,
    });
    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(APP_ERROR_CODES.CONFLICT, "Веќе постои сметка со оваа е-пошта.", 409);
    }
    throw error;
  }
}

export async function authenticateUser(raw: unknown): Promise<SessionUser> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      APP_ERROR_CODES.VALIDATION,
      parsed.error.issues[0]?.message ?? "Податоците не се валидни.",
      400,
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user || !user.isActive) {
    throw new AppError(APP_ERROR_CODES.UNAUTHENTICATED, "Невалидна е-пошта или лозинка.", 401);
  }
  if (!user.passwordHash) {
    throw new AppError(
      APP_ERROR_CODES.UNAUTHENTICATED,
      "Оваа сметка се најавува преку Google или Facebook.",
      401,
    );
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    throw new AppError(APP_ERROR_CODES.UNAUTHENTICATED, "Невалидна е-пошта или лозинка.", 401);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function getPublicAccount(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: publicUser,
  });
}

export async function listCustomers() {
  return prisma.user.findMany({
    where: { role: UserRole.CUSTOMER },
    select: publicUser,
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerAdminView(id: string) {
  return prisma.user.findUnique({
    where: { id, role: UserRole.CUSTOMER },
    select: {
      ...publicUser,
      inquiries: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, createdAt: true, status: true, message: true, item: { select: { title: true, referenceNumber: true } } },
      },
      itemRequests: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, createdAt: true, status: true, description: true },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, orderNumber: true, status: true, total: true, currency: true, createdAt: true },
      },
      reservationsOwned: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          reservedAt: true,
          reservedUntil: true,
          item: { select: { title: true, referenceNumber: true } },
        },
      },
    },
  });
}
