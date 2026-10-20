import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { printDemoUrls } from "./demo-urls.mjs";

process.chdir(fileURLToPath(new URL("../", import.meta.url)));
if (!existsSync(".env")) {
  console.error("Run npm run demo:setup once before starting the demo.");
  process.exit(1);
}
process.loadEnvFile(".env");
if (Number(process.env.PORT ?? 3001) !== 3001) {
  console.error("The demo proxy uses API port 3001. Set PORT=3001 in .env before running npm run demo.");
  process.exit(1);
}
const children = [];
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill();
  process.exitCode = code;
}
for (const args of [
  ["--import", "tsx", "server/src/server.ts"],
  ["node_modules/vite/bin/vite.js", "--config", "vite.config.ts", "--host", "0.0.0.0", "--port", "5173", "--strictPort"],
]) {
  const child = spawn(process.execPath, args, { stdio: "inherit", env: { ...process.env, NODE_ENV: "development" }, windowsHide: true });
  children.push(child);
  child.on("error", (error) => { console.error(error.message); stop(1); });
  child.on("exit", (code) => { if (!stopping) stop(code ?? 1); });
}
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
printDemoUrls();
