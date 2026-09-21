"use server";

import { cookies, headers } from "next/headers";
import { SocialProvider } from "@prisma/client";
import { createSession, destroySession, getSessionUser, requireSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";
import { authenticateUser, registerCustomer } from "@/server/services/account-service";
import {
  completePendingOAuthLink,
  unlinkSocialIdentity,
} from "@/server/services/oauth-service";
import { AppError, APP_ERROR_CODES, toErrorResponse } from "@/lib/errors";
import { publicPaths } from "@/lib/i18n/routes";
import { redirect } from "@/lib/i18n/redirect";
import { assertRateLimit } from "@/lib/security/rate-limit";
import {
  OAUTH_PENDING_COOKIE,
  pendingCookieOptions,
  verifyPendingOAuthLink,
} from "@/lib/auth/oauth-state";

export type ActionResult = { ok: true } | { ok: false; message: string };

function safeNext(raw: FormDataEntryValue | null, role: string) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/admin") && !isAdminRole(role)) return null;
  return value;
}

function afterLogin(role: string, next: string | null) {
  if (next) return next;
  return isAdminRole(role) ? publicPaths.admin : publicPaths.profile;
}

async function clientKey(kind: string) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `${kind}:${ip}`;
}

async function applyPendingOAuthLink(userId: string) {
  const jar = await cookies();
  const pendingToken = jar.get(OAUTH_PENDING_COOKIE)?.value;
  if (!pendingToken) return;
  const pending = await verifyPendingOAuthLink(pendingToken);
  jar.set(OAUTH_PENDING_COOKIE, "", { ...pendingCookieOptions, maxAge: 0 });
  if (!pending) return;
  await completePendingOAuthLink(userId, pending);
}

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  let destination: string = publicPaths.profile;
  try {
    if (!assertRateLimit(await clientKey("login"), 8, 10 * 60 * 1000)) {
      throw new AppError(APP_ERROR_CODES.VALIDATION, "Премногу обиди. Обидете се повторно подоцна.", 429);
    }
    const user = await authenticateUser({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    await applyPendingOAuthLink(user.id);
    await createSession(user);
    destination = afterLogin(user.role, safeNext(formData.get("next"), user.role));
  } catch (error) {
    return toErrorResponse(error);
  }
  redirect(destination);
}

export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    if (!assertRateLimit(await clientKey("register"), 5, 10 * 60 * 1000)) {
      throw new AppError(APP_ERROR_CODES.VALIDATION, "Премногу обиди. Обидете се повторно подоцна.", 429);
    }
    const user = await registerCustomer({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      phone: formData.get("phone") || "",
    });
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
  redirect(publicPaths.profile);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect(publicPaths.login);
}

export async function currentSessionAction() {
  return getSessionUser();
}

export async function unlinkSocialProviderAction(provider: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (session.role !== "CUSTOMER") {
      return { ok: false, message: "Немате дозвола за оваа акција." };
    }
    const normalized =
      provider === SocialProvider.GOOGLE || provider === "GOOGLE"
        ? SocialProvider.GOOGLE
        : provider === SocialProvider.FACEBOOK || provider === "FACEBOOK"
          ? SocialProvider.FACEBOOK
          : null;
    if (!normalized) {
      return { ok: false, message: "Начинот на најавување не е валиден." };
    }
    await unlinkSocialIdentity(session.id, normalized);
    return { ok: true };
  } catch (error) {
    return toErrorResponse(error);
  }
}
