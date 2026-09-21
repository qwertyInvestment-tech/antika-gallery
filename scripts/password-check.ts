import { hashPassword, verifyPassword } from "../src/lib/auth/password";

async function main() {
  const password = "temporary-check-password";
  const hashed = await hashPassword(password);
  const ok = await verifyPassword(password, hashed);
  const notOk = await verifyPassword("wrong-password", hashed);
  if (!ok || notOk) {
    throw new Error("Проверката на лозинка не помина.");
  }
  console.log("password-check: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
