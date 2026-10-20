import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

export default async function setup() {
  const directory = await mkdtemp(join(tmpdir(), "uniserve-test-"));
  if (dirname(resolve(directory)) !== resolve(tmpdir()) || !basename(directory).startsWith("uniserve-test-")) throw new Error("Unsafe temporary database directory");
  const cleanup = async () => {
    if (resolve(directory) === resolve("prisma") || resolve(join(directory, "test.db")) === resolve("prisma/dev.db")) throw new Error("Refusing to remove a live database");
    await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  };
  process.env.DATABASE_URL = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
  await writeFile(join(directory, "test.db"), "");
  try {
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: process.env, stdio: "pipe" });
    execFileSync(process.execPath, ["--import", "tsx", "prisma/seed.ts"], { env: process.env, stdio: "pipe" });
  } catch (error) {
    await cleanup();
    throw error;
  }
  return cleanup;
}
