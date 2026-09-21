import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import {
  getOAuthProviderConfig,
  parseSocialProvider,
} from "@/lib/auth/oauth-config";
import {
  OAUTH_STATE_COOKIE,
  createOAuthNonce,
  createPkcePair,
  oauthCookieOptions,
  safeOAuthNext,
  signOAuthState,
  type OAuthMode,
} from "@/lib/auth/oauth-state";
import { buildAuthorizationUrl } from "@/server/services/oauth-service";
import { publicPaths } from "@/lib/i18n/routes";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await context.params;
  const provider = parseSocialProvider(rawProvider);
  if (!provider || !getOAuthProviderConfig(provider)) {
    return NextResponse.redirect(new URL(`${publicPaths.login}?error=oauth`, env.APP_URL));
  }

  const url = new URL(request.url);
  const modeParam = url.searchParams.get("mode");
  const mode: OAuthMode = modeParam === "link" ? "link" : "login";
  const next = safeOAuthNext(url.searchParams.get("next"));

  let userId: string | null = null;
  if (mode === "link") {
    const session = await getSessionUser();
    if (!session || session.role !== UserRole.CUSTOMER) {
      return NextResponse.redirect(new URL(`${publicPaths.login}?error=oauth`, env.APP_URL));
    }
    userId = session.id;
  }

  const { codeVerifier, codeChallenge } = createPkcePair();
  const stateToken = await signOAuthState({
    provider,
    mode,
    next,
    nonce: createOAuthNonce(),
    codeVerifier,
    userId,
  });

  const authorizationUrl = buildAuthorizationUrl({
    provider,
    state: stateToken,
    codeChallenge,
  });

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, stateToken, oauthCookieOptions);
  return response;
}
