import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
} from "@/lib/auth/session-token";
import { env } from "@/lib/env";
import { publicPaths } from "@/lib/i18n/routes";
import { parseSocialProvider } from "@/lib/auth/oauth-config";
import {
  OAUTH_PENDING_COOKIE,
  OAUTH_STATE_COOKIE,
  pendingCookieOptions,
  safeOAuthNext,
  signPendingOAuthLink,
  verifyOAuthState,
} from "@/lib/auth/oauth-state";
import {
  exchangeAuthorizationCode,
  resolveSocialLogin,
} from "@/server/services/oauth-service";

export const runtime = "nodejs";

function loginErrorRedirect(messageKey = "oauth") {
  const url = new URL(publicPaths.login, env.APP_URL);
  url.searchParams.set("error", messageKey);
  return NextResponse.redirect(url);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await context.params;
  const provider = parseSocialProvider(rawProvider);
  if (!provider) return loginErrorRedirect();

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  if (oauthError || !code || !state) return loginErrorRedirect();

  const jar = await cookies();
  const stateCookie = jar.get(OAUTH_STATE_COOKIE)?.value;
  if (!stateCookie || stateCookie !== state) {
    return loginErrorRedirect();
  }

  try {
    const statePayload = await verifyOAuthState(state);
    if (statePayload.provider !== provider) return loginErrorRedirect();

    const profile = await exchangeAuthorizationCode({
      provider,
      code,
      codeVerifier: statePayload.codeVerifier,
    });

    const result = await resolveSocialLogin(profile, statePayload.mode, statePayload.userId);
    const destination =
      statePayload.mode === "link"
        ? publicPaths.profile
        : safeOAuthNext(statePayload.next) ?? publicPaths.profile;

    if (result.kind === "link_required") {
      const pendingToken = await signPendingOAuthLink(result.pending);
      const redirectUrl = new URL(publicPaths.login, env.APP_URL);
      redirectUrl.searchParams.set("error", "link-required");
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set(OAUTH_PENDING_COOKIE, pendingToken, pendingCookieOptions);
      response.cookies.set(OAUTH_STATE_COOKIE, "", { ...pendingCookieOptions, maxAge: 0 });
      return response;
    }

    const token = await signSessionToken(result.user);
    const response = NextResponse.redirect(new URL(destination, env.APP_URL));
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    response.cookies.set(OAUTH_STATE_COOKIE, "", { ...pendingCookieOptions, maxAge: 0 });
    response.cookies.set(OAUTH_PENDING_COOKIE, "", { ...pendingCookieOptions, maxAge: 0 });
    return response;
  } catch {
    return loginErrorRedirect();
  }
}
