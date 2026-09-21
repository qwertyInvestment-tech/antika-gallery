import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { SocialProvider } from "@prisma/client";
import { env } from "@/lib/env";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";

export const OAUTH_STATE_COOKIE = "antika.oauth.state";
export const OAUTH_PENDING_COOKIE = "antika.oauth.pending";
const STATE_TTL_SECONDS = 60 * 10;
const PENDING_TTL_SECONDS = 60 * 15;

export type OAuthMode = "login" | "link";

export type OAuthStatePayload = {
  provider: SocialProvider;
  mode: OAuthMode;
  next: string | null;
  nonce: string;
  codeVerifier: string;
  userId: string | null;
};

export type PendingOAuthLink = {
  provider: SocialProvider;
  providerAccountId: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean;
};

function secretKey() {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export function createOAuthNonce() {
  return randomBytes(24).toString("base64url");
}

export function createPkcePair() {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function safeOAuthNext(raw: string | null | undefined) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/admin") || value.startsWith("/api/")) return null;
  if (value.includes("://")) return null;
  return value;
}

export async function signOAuthState(payload: OAuthStatePayload) {
  return new SignJWT({
    provider: payload.provider,
    mode: payload.mode,
    next: payload.next,
    nonce: payload.nonce,
    codeVerifier: payload.codeVerifier,
    userId: payload.userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${STATE_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyOAuthState(token: string): Promise<OAuthStatePayload> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const provider = payload.provider;
    const mode = payload.mode;
    if (
      (provider !== SocialProvider.GOOGLE && provider !== SocialProvider.FACEBOOK) ||
      (mode !== "login" && mode !== "link") ||
      typeof payload.nonce !== "string" ||
      typeof payload.codeVerifier !== "string"
    ) {
      throw new Error("invalid");
    }
    return {
      provider,
      mode,
      next: typeof payload.next === "string" ? safeOAuthNext(payload.next) : null,
      nonce: payload.nonce,
      codeVerifier: payload.codeVerifier,
      userId: typeof payload.userId === "string" ? payload.userId : null,
    };
  } catch {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Најавувањето не успеа. Обидете се повторно.", 400);
  }
}

export async function signPendingOAuthLink(payload: PendingOAuthLink) {
  return new SignJWT({
    provider: payload.provider,
    providerAccountId: payload.providerAccountId,
    email: payload.email,
    name: payload.name,
    emailVerified: payload.emailVerified,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyPendingOAuthLink(token: string): Promise<PendingOAuthLink | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      (payload.provider !== SocialProvider.GOOGLE && payload.provider !== SocialProvider.FACEBOOK) ||
      typeof payload.providerAccountId !== "string"
    ) {
      return null;
    }
    return {
      provider: payload.provider,
      providerAccountId: payload.providerAccountId,
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" ? payload.name : null,
      emailVerified: payload.emailVerified === true,
    };
  } catch {
    return null;
  }
}

export const oauthCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: STATE_TTL_SECONDS,
};

export const pendingCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: PENDING_TTL_SECONDS,
};
