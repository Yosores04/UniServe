import cookieParser from "cookie-parser";
import express from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { customerRouter } from "./modules/customer/customer.routes.js";
import { riderRouter } from "./modules/rider/rider.routes.js";
import { shopRouter } from "./modules/shop/shop.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/auth", authRouter);
  app.use("/api/customer", customerRouter);
  app.use("/api/rider", riderRouter);
  app.use("/api/shop", shopRouter);
  app.use("/api/admin", adminRouter);

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok", service: "uniserve-api" });
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof Error && error.name === "ZodError") {
      response.status(400).json({ error: "VALIDATION_ERROR", message: "The request data is invalid." });
      return;
    }
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      response.status(409).json({ error: "CONFLICT", message: "The requested record already exists." });
      return;
    }
    console.error(error);
    response.status(500).json({ error: "INTERNAL_ERROR", message: "An unexpected server error occurred." });
  });

  return app;
}