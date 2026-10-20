import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");

export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development"
};
