import { AppError, APP_ERROR_CODES } from "@/lib/errors";
import { isAdminRole } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/session-token";

export function ensureAdmin(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new AppError(APP_ERROR_CODES.UNAUTHENTICATED, "Потребна е најава.", 401);
  }
  if (!isAdminRole(user.role)) {
    throw new AppError(APP_ERROR_CODES.FORBIDDEN, "Немате пристап до администрацијата.", 403);
  }
  return user;
}
