import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const isolated = existsSync(path.join(root, ".env.test"));
const envFile = isolated ? ".env.test" : ".env";

if (!isolated) {
  console.warn(
    "[antika] Tests load DATABASE_URL from .env (development database).\n" +
      "         Copy .env.test.example → .env.test and create antika_test when isolating.\n" +
      "         Do not prisma migrate reset the development database.",
  );
}

const testFiles = [
  "tests/catalog.test.ts",
  "tests/public-catalog.test.ts",
  "tests/customer.test.ts",
  "tests/commerce.test.ts",
  "tests/accounts.test.ts",
  "tests/hardening.test.ts",
  "tests/admin-media-v2.test.ts",
  "tests/social-login.test.ts",
];

const child = spawn("npx", ["tsx", "--env-file", envFile, "--test", ...testFiles], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
