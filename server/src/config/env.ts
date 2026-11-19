import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");

export const env = {
  host: process.env.HOST ?? (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development"
};
