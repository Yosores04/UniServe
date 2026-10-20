import { createApp } from "./app.js";
import { env } from "./config/env.js";

createApp().listen(env.port, "127.0.0.1", () => {
  console.log(`UniServe API listening on http://127.0.0.1:${env.port}`);
});
