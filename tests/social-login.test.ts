import assert from "node:assert/strict";
import { after, test } from "node:test";
import { SocialProvider, UserRole } from "@prisma/client";
import { prisma } from "../src/lib/db/prisma";
import { hashPassword } from "../src/lib/auth/password";
import {
  getConfiguredSocialProviders,
  isFacebookOAuthConfigured,
  isGoogleOAuthConfigured,
  missingSocialEnvVars,
  parseSocialProvider,
} from "../src/lib/auth/oauth-config";
import {
  createPkcePair,
  safeOAuthNext,
  signOAuthState,
  verifyOAuthState,
  signPendingOAuthLink,
  verifyPendingOAuthLink,
} from "../src/lib/auth/oauth-state";
import {
  completePendingOAuthLink,
  resolveSocialLogin,
  unlinkSocialIdentity,
} from "../src/server/services/oauth-service";
import { authenticateUser, registerCustomer } from "../src/server/services/account-service";
import { AppError } from "../src/lib/errors";

const createdUserIds: string[] = [];
let seq = 0;

async function makePasswordCustomer(email: string) {
  seq += 1;
  const user = await registerCustomer({
    name: `Social QA ${seq}`,
    email,
    password: "sigurnalozinka",
    confirmPassword: "sigurnalozinka",
  });
  createdUserIds.push(user.id);
  return user;
}

test("oauth providers parse and safe next rejects open redirects", () => {
  assert.equal(parseSocialProvider("google"), SocialProvider.GOOGLE);
  assert.equal(parseSocialProvider("facebook"), SocialProvider.FACEBOOK);
  assert.equal(parseSocialProvider("admin"), null);
  assert.equal(safeOAuthNext("/мој-профил"), "/мој-профил");
  assert.equal(safeOAuthNext("https://evil.example"), null);
  assert.equal(safeOAuthNext("//evil.example"), null);
  assert.equal(safeOAuthNext("/admin"), null);
  assert.equal(safeOAuthNext("/api/secret"), null);
});

test("oauth state round-trip and rejects tampering", async () => {
  const { codeVerifier } = createPkcePair();
  const token = await signOAuthState({
    provider: SocialProvider.GOOGLE,
    mode: "login",
    next: "/мој-профил",
    nonce: "abc",
    codeVerifier,
    userId: null,
  });
  const parsed = await verifyOAuthState(token);
  assert.equal(parsed.provider, SocialProvider.GOOGLE);
  assert.equal(parsed.codeVerifier, codeVerifier);
  await assert.rejects(() => verifyOAuthState(token + "x"), AppError);
});

test("missing configuration disables providers safely", () => {
  // Without credentials in env, both should be disabled.
  if (!process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET) {
    assert.equal(isGoogleOAuthConfigured(), false);
  }
  if (!process.env.FACEBOOK_CLIENT_ID && !process.env.FACEBOOK_CLIENT_SECRET) {
    assert.equal(isFacebookOAuthConfigured(), false);
  }
  const missing = missingSocialEnvVars();
  assert.ok(Array.isArray(missing));
  assert.ok(getConfiguredSocialProviders().every((p) => p === SocialProvider.GOOGLE || p === SocialProvider.FACEBOOK));
});

test("new Google identity creates CUSTOMER without password", async () => {
  const result = await resolveSocialLogin(
    {
      provider: SocialProvider.GOOGLE,
      providerAccountId: `g-new-${Date.now()}`,
      email: `gnew${Date.now()}@example.com`,
      emailVerified: true,
      name: "Google Нов",
    },
    "login",
    null,
  );
  assert.equal(result.kind, "session");
  if (result.kind !== "session") return;
  createdUserIds.push(result.user.id);
  assert.equal(result.user.role, UserRole.CUSTOMER);
  const stored = await prisma.user.findUnique({ where: { id: result.user.id } });
  assert.equal(stored?.passwordHash, null);
  assert.equal(stored?.role, UserRole.CUSTOMER);
});

test("existing Google identity logs into same user", async () => {
  const providerAccountId = `g-exist-${Date.now()}`;
  const first = await resolveSocialLogin(
    {
      provider: SocialProvider.GOOGLE,
      providerAccountId,
      email: `gexist${Date.now()}@example.com`,
      emailVerified: true,
      name: "Google Existing",
    },
    "login",
    null,
  );
  assert.equal(first.kind, "session");
  if (first.kind !== "session") return;
  createdUserIds.push(first.user.id);

  const second = await resolveSocialLogin(
    {
      provider: SocialProvider.GOOGLE,
      providerAccountId,
      email: `other${Date.now()}@example.com`,
      emailVerified: true,
      name: "Google Existing",
    },
    "login",
    null,
  );
  assert.equal(second.kind, "session");
  if (second.kind !== "session") return;
  assert.equal(second.user.id, first.user.id);
});

test("existing email account requires safe linking (no auto merge)", async () => {
  const email = `linkreq${Date.now()}@example.com`;
  const customer = await makePasswordCustomer(email);
  const result = await resolveSocialLogin(
    {
      provider: SocialProvider.GOOGLE,
      providerAccountId: `g-linkreq-${Date.now()}`,
      email,
      emailVerified: true,
      name: "Should Link",
    },
    "login",
    null,
  );
  assert.equal(result.kind, "link_required");
  if (result.kind !== "link_required") return;
  const count = await prisma.user.count({ where: { email } });
  assert.equal(count, 1);
  assert.equal(customer.id, customer.id);
});

test("authenticated customer can link Google and Facebook", async () => {
  const email = `linkok${Date.now()}@example.com`;
  const customer = await makePasswordCustomer(email);
  const googleId = `g-linkok-${Date.now()}`;
  const facebookId = `f-linkok-${Date.now()}`;

  const google = await resolveSocialLogin(
    {
      provider: SocialProvider.GOOGLE,
      providerAccountId: googleId,
      email,
      emailVerified: true,
      name: "Link OK",
    },
    "link",
    customer.id,
  );
  assert.equal(google.kind, "session");

  const facebook = await resolveSocialLogin(
    {
      provider: SocialProvider.FACEBOOK,
      providerAccountId: facebookId,
      email,
      emailVerified: true,
      name: "Link OK",
    },
    "link",
    customer.id,
  );
  assert.equal(facebook.kind, "session");

  const identities = await prisma.socialIdentity.findMany({ where: { userId: customer.id } });
  assert.equal(identities.length, 2);
});

test("provider identity linked to another user is blocked", async () => {
  const first = await makePasswordCustomer(`owner${Date.now()}@example.com`);
  const second = await makePasswordCustomer(`other${Date.now()}@example.com`);
  const providerAccountId = `g-taken-${Date.now()}`;
  await resolveSocialLogin(
    {
      provider: SocialProvider.GOOGLE,
      providerAccountId,
      email: first.email,
      emailVerified: true,
      name: "Owner",
    },
    "link",
    first.id,
  );
  await assert.rejects(
    () =>
      resolveSocialLogin(
        {
          provider: SocialProvider.GOOGLE,
          providerAccountId,
          email: second.email,
          emailVerified: true,
          name: "Other",
        },
        "link",
        second.id,
      ),
    AppError,
  );
});

test("pending link completes only for matching customer email", async () => {
  const email = `pending${Date.now()}@example.com`;
  const customer = await makePasswordCustomer(email);
  const pending = {
    provider: SocialProvider.GOOGLE,
    providerAccountId: `g-pending-${Date.now()}`,
    email,
    name: "Pending",
    emailVerified: true,
  };
  const token = await signPendingOAuthLink(pending);
  const verified = await verifyPendingOAuthLink(token);
  assert.ok(verified);
  await completePendingOAuthLink(customer.id, verified!);
  const identity = await prisma.socialIdentity.findFirst({
    where: { userId: customer.id, provider: SocialProvider.GOOGLE },
  });
  assert.ok(identity);

  const other = await makePasswordCustomer(`pending2${Date.now()}@example.com`);
  await assert.rejects(() => completePendingOAuthLink(other.id, verified!), AppError);
});

test("unlink blocked when it would lock out account", async () => {
  const result = await resolveSocialLogin(
    {
      provider: SocialProvider.FACEBOOK,
      providerAccountId: `f-only-${Date.now()}`,
      email: null,
      emailVerified: false,
      name: "FB Only",
    },
    "login",
    null,
  );
  assert.equal(result.kind, "session");
  if (result.kind !== "session") return;
  createdUserIds.push(result.user.id);
  await assert.rejects(() => unlinkSocialIdentity(result.user.id, SocialProvider.FACEBOOK), AppError);
});

test("password login still works and social-only cannot use password", async () => {
  const email = `pwd${Date.now()}@example.com`;
  await makePasswordCustomer(email);
  const session = await authenticateUser({ email, password: "sigurnalozinka" });
  assert.equal(session.email, email);

  const social = await resolveSocialLogin(
    {
      provider: SocialProvider.GOOGLE,
      providerAccountId: `g-nopwd-${Date.now()}`,
      email: `nopwd${Date.now()}@example.com`,
      emailVerified: true,
      name: "No Password",
    },
    "login",
    null,
  );
  assert.equal(social.kind, "session");
  if (social.kind !== "session") return;
  createdUserIds.push(social.user.id);
  await assert.rejects(
    () => authenticateUser({ email: social.user.email, password: "whateverpass" }),
    AppError,
  );
});

test("social login cannot elevate to ADMIN", async () => {
  const adminEmail = `admin-social-${Date.now()}@example.com`;
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin Social Trap",
      passwordHash: await hashPassword("sigurnalozinka"),
      role: UserRole.ADMIN,
    },
  });
  createdUserIds.push(admin.id);
  await assert.rejects(
    () =>
      resolveSocialLogin(
        {
          provider: SocialProvider.GOOGLE,
          providerAccountId: `g-admin-${Date.now()}`,
          email: adminEmail,
          emailVerified: true,
          name: "Admin Trap",
        },
        "login",
        null,
      ),
    AppError,
  );
});

test("provider identity uniqueness constraint", async () => {
  const providerAccountId = `g-unique-${Date.now()}`;
  const first = await resolveSocialLogin(
    {
      provider: SocialProvider.GOOGLE,
      providerAccountId,
      email: `u1${Date.now()}@example.com`,
      emailVerified: true,
      name: "U1",
    },
    "login",
    null,
  );
  assert.equal(first.kind, "session");
  if (first.kind !== "session") return;
  createdUserIds.push(first.user.id);

  await assert.rejects(
    () =>
      prisma.socialIdentity.create({
        data: {
          provider: SocialProvider.GOOGLE,
          providerAccountId,
          userId: first.user.id,
        },
      }),
  );
});

after(async () => {
  if (createdUserIds.length) {
    await prisma.socialIdentity.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.favorite.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.inquiry.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.itemRequest.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});
