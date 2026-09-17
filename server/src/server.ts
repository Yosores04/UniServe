import { createApp } from "./app.js";
import { env } from "./config/env.js";

createApp().listen(env.port, () => {
  console.log(`UniServe API listening on http://127.0.0.1:${env.port}`);
});