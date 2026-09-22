import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session-token";
import { isAdminRole } from "@/lib/auth/roles";
import { publicPaths, routeRewrites } from "@/lib/i18n/routes";

function rewritePath(pathname: string) {
  const exact = routeRewrites.find((rule) => rule.source === pathname);
  if (exact) return exact.destination;
  if (pathname.startsWith("/категории/")) return `/kategorii/${pathname.slice("/категории/".length)}`;
  if (pathname.startsWith("/предмет/")) return `/predmet/${pathname.slice("/предмет/".length)}`;
  if (pathname.startsWith("/приказни/")) return `/prikazni/${pathname.slice("/приказни/".length)}`;
  if (pathname.startsWith("/моите-нарачки/")) {
    return `/moite-naracki/${pathname.slice("/моите-нарачки/".length)}`;
  }
  return pathname;
}

function isCustomerProtected(pathname: string) {
  return (
    pathname === "/moj-profil" ||
    pathname === "/moite-naracki" ||
    pathname.startsWith("/moite-naracki/") ||
    pathname === "/moite-rezervacii"
  );
}

export async function proxy(request: NextRequest) {
  const pathname = decodeURIComponent(request.nextUrl.pathname);
  const destination = rewritePath(pathname);

  if (pathname.startsWith("/admin") || destination.startsWith("/admin")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const loginUrl = new URL(publicPaths.login, request.url);
    if (!token) {
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const session = await verifySessionToken(token);
    if (!session || !isAdminRole(session.role)) {
      if (session && !isAdminRole(session.role)) {
        return NextResponse.redirect(new URL(publicPaths.profile, request.url));
      }
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isCustomerProtected(destination)) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL(publicPaths.login, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const session = await verifySessionToken(token);
    if (!session) {
      const loginUrl = new URL(publicPaths.login, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (destination !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
