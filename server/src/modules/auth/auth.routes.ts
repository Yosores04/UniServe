import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { authenticate } from "../../middleware/authenticate.js";
import { createSession, login, register, sessionCookie } from "./auth.service.js";

const authRouter = Router();
const credentials = z.object({ email: z.string().email(), password: z.string().min(6) });

function publicUser(user: { id: string; name: string; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

authRouter.post("/register", async (request, response, next) => {
  try {
    const input = credentials.extend({ name: z.string().min(2), role: z.enum(["CUSTOMER", "RIDER", "SHOP"]) }).parse(request.body);
    const result = await register(input.name, input.email, input.password, input.role);
    response.cookie(sessionCookie, result.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 24 * 7 });
    response.status(201).json({ user: publicUser(result.user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (request, response, next) => {
  try {
    const input = credentials.parse(request.body);
    const result = await login(input.email, input.password);
    if (!result) {
      response.status(401).json({ error: "INVALID_CREDENTIALS", message: "Email or password is incorrect." });
      return;
    }
    response.cookie(sessionCookie, result.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 24 * 7 });
    response.json({ user: publicUser(result.user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", authenticate, async (request, response, next) => {
  try {
    const token = request.cookies?.[sessionCookie];
    if (token) await prisma.session.deleteMany({ where: { userId: request.user!.id } });
    response.clearCookie(sessionCookie);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", authenticate, (request, response) => {
  response.json({ user: request.user });
});

export { authRouter };
