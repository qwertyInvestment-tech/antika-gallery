# ANTIKA — Production readiness (Phase 7)

This document is launch **preparation**, not a deployment. Do not treat localhost values as production.

## A. Architecture

```text
Domain
  ↓
Next.js application
  ↓
Managed PostgreSQL
  ↓
S3-compatible object storage
```

Provider is not chosen in this phase. The application already uses PostgreSQL via Prisma. Object storage is abstracted (`LOCAL` | `S3` | `R2`). The LOCAL adapter is implemented. S3/R2 adapters are schema-ready and must be wired with real credentials at deploy time.

## B. Required environment variables

Names / placeholders only. Never commit real secrets.

| Variable | Notes |
|---|---|
| `NODE_ENV` | `production` |
| `APP_URL` | Public origin, e.g. `https://example.com` — **do not leave localhost** |
| `DATABASE_URL` | Managed PostgreSQL connection string |
| `AUTH_SECRET` | HMAC key, ≥ 32 random characters. **Not** the `.env.example` placeholder |
| `STORAGE_PROVIDER` | `LOCAL` for development; `BLOB` for Vercel production (`S3`/`R2` reserved, not wired) |
| `STORAGE_LOCAL_DIR` | Development only (`./storage`) |
| `STORAGE_PUBLIC_BASE_URL` | LOCAL media base (`/api/media`) |
| `BLOB_READ_WRITE_TOKEN` | Required when `STORAGE_PROVIDER=BLOB`. Set in Vercel Environment Variables |
| `AWS_S3_*` / `R2_*` | Reserved for a later adapter; unused today |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_NAME` | Seed / bootstrap only. Do **not** run seed automatically in production |

`.env` is gitignored. `.env.example` contains placeholders only.

## C. Database migration procedure

1. Use the existing `antika` database. Never `prisma migrate reset`, never drop/recreate.
2. Apply only tracked additive migrations: `prisma migrate deploy` against production.
3. Review SQL before apply. Phase 0–6 data must remain.
4. Seed (`prisma db seed`) is **not** part of production startup.

Partial unique index `Reservation_item_active_unique` (one ACTIVE reservation per item) lives in the Phase 5 migration SQL and must be preserved.

## D. Storage configuration

**Development:** `STORAGE_PROVIDER=LOCAL`, files under `./storage` (gitignored), served via `/api/media`.

**Production (Vercel):** `STORAGE_PROVIDER=BLOB` with `BLOB_READ_WRITE_TOKEN` from a Vercel Blob store. Admin uploads go browser → Vercel Blob (client upload token), then MediaAsset metadata is saved in Postgres. Public pages use the absolute Blob URL. S3/R2 adapters remain unimplemented.

## E. Authentication

- bcrypt (12 rounds), jose HS256 JWT in HTTP-only cookie `antika.session`
- Cookie: `httpOnly`, `sameSite=lax`, `path=/`, `maxAge` 7 days, `secure` when `NODE_ENV=production`
- Session payload: `id` (JWT `sub`), `email`, `name`, `role` only
- Roles: `CUSTOMER`, `ADMIN`, `SUPER_ADMIN`
- Production **must** use HTTPS so `Secure` cookies are sent
- `AUTH_SECRET` must be unique, random, ≥ 32 characters

## F. Domain

Canonical URLs, Open Graph, sitemap, and robots use `APP_URL`.

Set `APP_URL` to the real public origin **before** launch. Do not guess or hardcode a domain in the repository.

## G. Email

Password reset: **NOT IMPLEMENTED — requires production email delivery infrastructure.**

Do not invent SMTP. No reset tokens are issued.

## H. Rate limiting

In-memory limits exist for login, registration, inquiry, wanted request, and contact.

This is **not** distributed. Multiple instances / serverless replicas each have their own counters.

Production implication: put a WAF / reverse-proxy rate limit in front of the app, or accept the in-memory limit only for a single long-lived Node process.

## I. Deployment checklist

- [ ] Environment variables set (no placeholders, no committed secrets)
- [ ] Managed PostgreSQL reachable from the app
- [ ] `prisma migrate deploy` (additive only)
- [ ] Object storage configured (or LOCAL accepted only for a private preview)
- [ ] `APP_URL` is the real HTTPS origin
- [ ] TLS / HTTPS
- [ ] `AUTH_SECRET` rotated from any example value
- [ ] Production build (`npm run build` && `npm start`)
- [ ] Smoke: home, collection, item, login, register, admin, customer profile
- [ ] `https://<origin>/sitemap.xml` and `/robots.txt`
- [ ] Analytics: not configured in Phase 7 (optional later)
- [ ] HSTS / Content-Security-Policy: add at the edge once the domain and image hosts are known
- [ ] Do not run `prisma db seed` on production unless explicitly intended

## J. Security headers currently set in Next.js

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Not** set in-app (needs real domain / HTTPS / image hosts):

- HSTS
- Content-Security-Policy

## K. Cyrillic Server Action redirects

Server Actions must percent-encode Macedonian paths before `redirect()`, because `x-action-redirect` is an HTTP header (ASCII only). Public URLs remain `/мој-профил`, `/најава`, etc.

## L. Known product gaps (not Phase 7 work)

- Password reset
- S3/R2 storage adapter implementation (BLOB is the production path on Vercel)
- Distributed rate limiting
- Email delivery
- Payments / shipping (out of scope)
