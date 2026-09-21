import { SocialProvider, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { SessionUser } from "@/lib/auth/session-token";
import { AppError, APP_ERROR_CODES } from "@/lib/errors";
import {
  getOAuthProviderConfig,
  oauthCallbackUrl,
  socialProviderLabel,
} from "@/lib/auth/oauth-config";
import type { OAuthMode, PendingOAuthLink } from "@/lib/auth/oauth-state";

export type ProviderProfile = {
  provider: SocialProvider;
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
};

export type SocialLoginResult =
  | { kind: "session"; user: SessionUser }
  | { kind: "link_required"; pending: PendingOAuthLink };

function sessionFromUser(user: { id: string; email: string; name: string; role: UserRole }): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function syntheticEmail(provider: SocialProvider, providerAccountId: string) {
  const slug = provider === SocialProvider.GOOGLE ? "google" : "facebook";
  return `oauth+${slug}.${providerAccountId}@users.antika.local`;
}

export async function exchangeAuthorizationCode(input: {
  provider: SocialProvider;
  code: string;
  codeVerifier: string;
}): Promise<ProviderProfile> {
  const config = getOAuthProviderConfig(input.provider);
  if (!config) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Најавувањето не успеа. Обидете се повторно.", 400);
  }

  const body = new URLSearchParams({
    code: input.code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: oauthCallbackUrl(input.provider),
    grant_type: "authorization_code",
  });
  if (input.provider === SocialProvider.GOOGLE) {
    body.set("code_verifier", input.codeVerifier);
  }

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!tokenResponse.ok) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Најавувањето не успеа. Обидете се повторно.", 400);
  }
  const tokenJson = (await tokenResponse.json()) as {
    access_token?: string;
    id_token?: string;
    error?: string;
  };
  if (!tokenJson.access_token) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Најавувањето не успеа. Обидете се повторно.", 400);
  }

  if (input.provider === SocialProvider.GOOGLE) {
    const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!userInfoResponse.ok) {
      throw new AppError(APP_ERROR_CODES.VALIDATION, "Најавувањето не успеа. Обидете се повторно.", 400);
    }
    const profile = (await userInfoResponse.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };
    if (!profile.sub) {
      throw new AppError(APP_ERROR_CODES.VALIDATION, "Најавувањето не успеа. Обидете се повторно.", 400);
    }
    return {
      provider: SocialProvider.GOOGLE,
      providerAccountId: profile.sub,
      email: profile.email?.trim().toLowerCase() || null,
      emailVerified: profile.email_verified === true,
      name: profile.name?.trim() || null,
    };
  }

  const facebookUrl = new URL("https://graph.facebook.com/v21.0/me");
  facebookUrl.searchParams.set("fields", "id,name,email");
  facebookUrl.searchParams.set("access_token", tokenJson.access_token);
  const facebookResponse = await fetch(facebookUrl);
  if (!facebookResponse.ok) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Најавувањето не успеа. Обидете се повторно.", 400);
  }
  const profile = (await facebookResponse.json()) as {
    id?: string;
    email?: string;
    name?: string;
  };
  if (!profile.id) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Најавувањето не успеа. Обидете се повторно.", 400);
  }
  return {
    provider: SocialProvider.FACEBOOK,
    providerAccountId: profile.id,
    email: profile.email?.trim().toLowerCase() || null,
    // Facebook Graph may return email only when granted; treat presence as provider-asserted.
    emailVerified: Boolean(profile.email),
    name: profile.name?.trim() || null,
  };
}

export function buildAuthorizationUrl(input: {
  provider: SocialProvider;
  state: string;
  codeChallenge: string;
}) {
  const config = getOAuthProviderConfig(input.provider);
  if (!config) {
    throw new AppError(APP_ERROR_CODES.VALIDATION, "Најавувањето не успеа. Обидете се повторно.", 400);
  }
  const url = new URL(config.authorizationUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", oauthCallbackUrl(input.provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", input.state);
  if (input.provider === SocialProvider.GOOGLE) {
    url.searchParams.set("code_challenge", input.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("access_type", "online");
    url.searchParams.set("prompt", "select_account");
  }
  return url.toString();
}

export async function resolveSocialLogin(
  profile: ProviderProfile,
  mode: OAuthMode,
  linkingUserId: string | null,
): Promise<SocialLoginResult> {
  const existingIdentity = await prisma.socialIdentity.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (mode === "link") {
    if (!linkingUserId) {
      throw new AppError(APP_ERROR_CODES.UNAUTHENTICATED, "Потребна е најава.", 401);
    }
    const user = await prisma.user.findUnique({ where: { id: linkingUserId } });
    if (!user || !user.isActive || user.role !== UserRole.CUSTOMER) {
      throw new AppError(
        APP_ERROR_CODES.FORBIDDEN,
        "Овој профил не може да се поврзе со избраниот начин на најавување.",
        403,
      );
    }
    if (existingIdentity && existingIdentity.userId !== user.id) {
      throw new AppError(
        APP_ERROR_CODES.CONFLICT,
        "Овој профил не може да се поврзе со избраниот начин на најавување.",
        409,
      );
    }
    if (!existingIdentity) {
      await prisma.socialIdentity.create({
        data: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
          userId: user.id,
          email: profile.email,
        },
      });
    }
    return { kind: "session", user: sessionFromUser(user) };
  }

  if (existingIdentity) {
    const user = existingIdentity.user;
    if (!user.isActive || user.role !== UserRole.CUSTOMER) {
      throw new AppError(
        APP_ERROR_CODES.FORBIDDEN,
        "Овој профил не може да се поврзе со избраниот начин на најавување.",
        403,
      );
    }
    return { kind: "session", user: sessionFromUser(user) };
  }

  if (profile.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
    if (byEmail) {
      if (byEmail.role !== UserRole.CUSTOMER || !byEmail.isActive) {
        throw new AppError(
          APP_ERROR_CODES.FORBIDDEN,
          "Овој профил не може да се поврзе со избраниот начин на најавување.",
          403,
        );
      }
      // Existing email/password (or other) account — require ownership proof before linking.
      return {
        kind: "link_required",
        pending: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
          email: profile.email,
          name: profile.name,
          emailVerified: profile.emailVerified,
        },
      };
    }
  }

  const email = profile.email ?? syntheticEmail(profile.provider, profile.providerAccountId);
  const name =
    profile.name?.trim() ||
    (profile.email ? profile.email.split("@")[0] : socialProviderLabel(profile.provider));

  const user = await prisma.user.create({
    data: {
      email,
      name: name.slice(0, 80),
      passwordHash: null,
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerifiedAt: profile.email && profile.emailVerified ? new Date() : null,
      socialIdentities: {
        create: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
          email: profile.email,
        },
      },
    },
  });

  return { kind: "session", user: sessionFromUser(user) };
}

export async function completePendingOAuthLink(userId: string, pending: PendingOAuthLink) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive || user.role !== UserRole.CUSTOMER) {
    throw new AppError(
      APP_ERROR_CODES.FORBIDDEN,
      "Овој профил не може да се поврзе со избраниот начин на најавување.",
      403,
    );
  }
  if (pending.email && pending.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new AppError(
      APP_ERROR_CODES.CONFLICT,
      "Овој профил не може да се поврзе со избраниот начин на најавување.",
      409,
    );
  }

  const existingIdentity = await prisma.socialIdentity.findUnique({
    where: {
      provider_providerAccountId: {
        provider: pending.provider,
        providerAccountId: pending.providerAccountId,
      },
    },
  });
  if (existingIdentity && existingIdentity.userId !== user.id) {
    throw new AppError(
      APP_ERROR_CODES.CONFLICT,
      "Овој профил не може да се поврзе со избраниот начин на најавување.",
      409,
    );
  }
  if (!existingIdentity) {
    await prisma.socialIdentity.create({
      data: {
        provider: pending.provider,
        providerAccountId: pending.providerAccountId,
        userId: user.id,
        email: pending.email,
      },
    });
  }
  if (pending.emailVerified && !user.emailVerifiedAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
  }
}

export async function listLoginMethods(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordHash: true,
      socialIdentities: {
        select: { id: true, provider: true, email: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!user) return null;
  return {
    hasPassword: Boolean(user.passwordHash),
    identities: user.socialIdentities,
  };
}

export async function unlinkSocialIdentity(userId: string, provider: SocialProvider) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      passwordHash: true,
      socialIdentities: { select: { id: true, provider: true } },
    },
  });
  if (!user || user.role !== UserRole.CUSTOMER) {
    throw new AppError(APP_ERROR_CODES.FORBIDDEN, "Немате дозвола за оваа акција.", 403);
  }

  const identity = user.socialIdentities.find((row) => row.provider === provider);
  if (!identity) {
    throw new AppError(APP_ERROR_CODES.NOT_FOUND, "Начинот на најавување не е пронајден.", 404);
  }

  const remainingSocial = user.socialIdentities.filter((row) => row.provider !== provider).length;
  const hasPassword = Boolean(user.passwordHash);
  if (!hasPassword && remainingSocial === 0) {
    throw new AppError(
      APP_ERROR_CODES.CONFLICT,
      "Не можете да го отстраните единствениот начин на најавување.",
      409,
    );
  }

  await prisma.socialIdentity.delete({ where: { id: identity.id } });
}
