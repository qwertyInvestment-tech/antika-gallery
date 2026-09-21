import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "@/lib/env";
import type { UserRole } from "@/lib/auth/roles";

export const SESSION_COOKIE = "antika.session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type SessionPayload = JWTPayload & SessionUser;

function secretKey() {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const session = payload as SessionPayload;
    if (!session.sub || !session.email || !session.role || !session.name) {
      return null;
    }
    return {
      id: session.sub,
      email: session.email,
      name: session.name,
      role: session.role,
    };
  } catch {
    return null;
  }
}
