import { cookies } from "next/headers";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";
import { ensureAdmin } from "@/lib/auth/admin";
import type { UserRole } from "@/lib/auth/roles";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionUser,
} from "@/lib/auth/session-token";

export type { SessionUser };

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await signSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError(APP_ERROR_CODES.UNAUTHENTICATED, "Потребна е најава.", 401);
  }
  return user;
}

export { ensureAdmin } from "@/lib/auth/admin";

export async function requireAdmin(): Promise<SessionUser> {
  return ensureAdmin(await getSessionUser());
}

export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const user = await requireSession();
  if (!roles.includes(user.role)) {
    throw new AppError(APP_ERROR_CODES.FORBIDDEN, "Немате дозвола за оваа акција.", 403);
  }
  return user;
}
