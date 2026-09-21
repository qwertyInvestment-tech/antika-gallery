process.env.NODE_ENV ??= "development";
process.env.APP_URL ??= "http://localhost:3000";
process.env.DATABASE_URL ??= "postgresql://antika:antika@localhost:5433/antika";
process.env.AUTH_SECRET ??= "local-session-check-secret-value-32ch";

async function main() {
  const { signSessionToken, verifySessionToken } = await import("../src/lib/auth/session-token");

  const token = await signSessionToken({
    id: "00000000-0000-0000-0000-000000000001",
    email: "session-check@antika.mk",
    name: "Проверка",
    role: "ADMIN",
  });
  const session = await verifySessionToken(token);
  if (!session || session.email !== "session-check@antika.mk" || session.role !== "ADMIN") {
    throw new Error("Сесискиот токен не е валиден.");
  }
  console.log("session-check: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
