# ANTIKA — архитектура (Фаза 0)

ANTIKA е онлајн антикварница за македонскиот пазар. Јавниот јазик е македонски. Англиската верзија не се гради сега; кодот е подготвен за идно `en` преку `src/lib/i18n/locale.ts`.

## Слоеви

```
UI (App Router)
  → Server Actions / Route Handlers
    → Business logic (`src/lib/domain`, `src/server/services`)
      → Data access (`src/server/repositories`)
        → Prisma
          → PostgreSQL
```

Правило: UI не зборува директно со Prisma. Во Фаза 0 се поставени слоевите и границите; репозиториумите се полнат од Фаза 2 (Catalog Engine).

## Структура

```
src/app            јавни и админ рути, API
src/server/actions серверски акции
src/server/services деловна логика
src/server/repositories пристап до податоци
src/lib/auth       сесии, лозинки, улоги
src/lib/db         Prisma клиент
src/lib/domain     статуси, референтни броеви
src/lib/validation Zod шеми
src/lib/storage    апстракција за object storage
src/lib/i18n       локал (сега само mk)
prisma             шема и миграции
```

## Предмет, не залиха

Секој антиквитет е еден физички примерок (`Item`) со уникатен `referenceNumber` (`ANT-000001`). Нема quantity. Продадениот предмет останува со статус `SOLD`.

Дозволени премини се во `src/lib/domain/item-status.ts`. `SOLD` е краен продажен статус и не се брише.

## Автентикација

Потпишана HTTP-only сесиска колачинка (JWT, `jose`), лозинки со bcrypt (12 rounds). Улоги: `SUPER_ADMIN`, `ADMIN`, `CUSTOMER`. `/admin` е заштитен преку `src/proxy.ts`.

Auth.js (next-auth v5) не е вклучен: сè уште е на beta канал, а основата мора да биде стабилна за production.

## Медиуми

`MediaAsset` + `STORAGE_PROVIDER` (`LOCAL` | `BLOB` | `S3` | `R2`). `LOCAL` и `BLOB` (Vercel Blob client upload) се активни. S3/R2 остануваат резервирани.

## Јавни URL-и

На Windows, App Router директориумите се ASCII (`src/app/prijava`). Јавниот URL `/најава` се врзува преку `src/proxy.ts` (rewrite) и `rewrites` во `next.config.ts`, за да не се крши generate на кирилични папки.

Server Action `redirect()` кон кирилични патеки мора да користи `headerSafePath` (`src/lib/i18n/redirect.ts`): HTTP заглавјето `x-action-redirect` не смее да содржи raw Unicode. Јавниот URL останува македонски.

## Локална база

PostgreSQL 16 на порт **5433** (`docker compose up -d`), одвоена од други локални Postgres инстанци.
