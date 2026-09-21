# ANTIKA

Онлајн антикварница. Слоган: **Предмети со историја.**

Јавниот интерфејс е на македонски јазик.

## Фаза 0

Архитектура, Next.js, PostgreSQL, Prisma, автентикација, валидација и структура на проектот. Јавниот каталог сè уште не се гради.

Детали: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Локално стартување

1. `docker compose up -d`
2. Копирај `.env.example` во `.env` и постави `AUTH_SECRET`
3. `npx prisma migrate dev`
4. `npx prisma db seed`
5. `npm run dev`

Отвори [http://localhost:3000](http://localhost:3000). Админ најава: `/најава`. Проверка на база: `/api/health`.

Локалната bootstrap сметка е во `.env` (`BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`). Промени ги пред било каков вистински пристап.

На оваа машина, Prisma postinstall скриптите мора да бидат одобрени (`npm install-scripts approve prisma @prisma/client @prisma/engines`), инаку клиентот не се генерира.
