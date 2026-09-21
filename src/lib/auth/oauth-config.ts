import { SocialProvider } from "@prisma/client";
import { env } from "@/lib/env";

export type OAuthProviderConfig = {
  provider: SocialProvider;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
};

export function isGoogleOAuthConfigured() {
  return Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim());
}

export function isFacebookOAuthConfigured() {
  return Boolean(env.FACEBOOK_CLIENT_ID?.trim() && env.FACEBOOK_CLIENT_SECRET?.trim());
}

export function getConfiguredSocialProviders(): SocialProvider[] {
  const providers: SocialProvider[] = [];
  if (isGoogleOAuthConfigured()) providers.push(SocialProvider.GOOGLE);
  if (isFacebookOAuthConfigured()) providers.push(SocialProvider.FACEBOOK);
  return providers;
}

export function missingSocialEnvVars() {
  const missing: string[] = [];
  if (!env.GOOGLE_CLIENT_ID?.trim()) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET?.trim()) missing.push("GOOGLE_CLIENT_SECRET");
  if (!env.FACEBOOK_CLIENT_ID?.trim()) missing.push("FACEBOOK_CLIENT_ID");
  if (!env.FACEBOOK_CLIENT_SECRET?.trim()) missing.push("FACEBOOK_CLIENT_SECRET");
  return missing;
}

export function oauthCallbackUrl(provider: SocialProvider) {
  const base = env.APP_URL.replace(/\/$/, "");
  const slug = provider === SocialProvider.GOOGLE ? "google" : "facebook";
  return `${base}/api/auth/oauth/${slug}/callback`;
}

export function getOAuthProviderConfig(provider: SocialProvider): OAuthProviderConfig | null {
  if (provider === SocialProvider.GOOGLE) {
    if (!isGoogleOAuthConfigured()) return null;
    return {
      provider,
      clientId: env.GOOGLE_CLIENT_ID!.trim(),
      clientSecret: env.GOOGLE_CLIENT_SECRET!.trim(),
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["openid", "email", "profile"],
    };
  }

  if (provider === SocialProvider.FACEBOOK) {
    if (!isFacebookOAuthConfigured()) return null;
    return {
      provider,
      clientId: env.FACEBOOK_CLIENT_ID!.trim(),
      clientSecret: env.FACEBOOK_CLIENT_SECRET!.trim(),
      authorizationUrl: "https://www.facebook.com/v21.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
      scopes: ["email", "public_profile"],
    };
  }

  return null;
}

export function parseSocialProvider(value: string): SocialProvider | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "google") return SocialProvider.GOOGLE;
  if (normalized === "facebook") return SocialProvider.FACEBOOK;
  return null;
}

export function socialProviderLabel(provider: SocialProvider) {
  return provider === SocialProvider.GOOGLE ? "Google" : "Facebook";
}
