import { existsSync, copyFileSync, mkdirSync, closeSync, openSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

process.chdir(fileURLToPath(new URL("../", import.meta.url)));
if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("Created .env from .env.example.");
}
process.loadEnvFile(".env");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.startsWith("file:")) throw new Error("The local demo requires a SQLite file: DATABASE_URL.");
// Prisma's SQLite relative paths are resolved against prisma/schema.prisma.
const databasePath = resolve("prisma", databaseUrl.slice(5));
mkdirSync(dirname(databasePath), { recursive: true });
if (!existsSync(databasePath)) closeSync(openSync(databasePath, "wx"));
for (const args of [["node_modules/prisma/build/index.js", "migrate", "deploy"], ["--import", "tsx", "prisma/seed.ts"]]) {
  execFileSync(process.execPath, args, { stdio: "inherit", env: process.env });
}
console.log("\nDemo database is ready. Existing account passwords and orders are preserved.\nStart with: npm run demo");
