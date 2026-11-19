import { resolve } from "node:path";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const webRoot = env.nodeEnv === "production" ? resolve("dist") : undefined;
createApp(webRoot).listen(env.port, env.host, () => {
  console.log(`UniServe listening on http://${env.host}:${env.port}`);
});
