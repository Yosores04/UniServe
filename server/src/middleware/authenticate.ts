import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "RIDER" | "SHOP" | "ADMIN";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function authenticate(request: Request, response: Response, next: NextFunction) {
  const token = request.cookies?.uniserve_session;
  if (!token) {
    response.status(401).json({ error: "UNAUTHENTICATED", message: "Sign in is required." });
    return;
  }

  const session = await prisma.session.findUnique({ where: { tokenHash: hashSessionToken(token) }, include: { user: true } });
  if (!session || session.expiresAt <= new Date() || !session.user.active) {
    response.clearCookie("uniserve_session");
    response.status(401).json({ error: "UNAUTHENTICATED", message: "Your session has expired." });
    return;
  }

  request.user = { id: session.user.id, email: session.user.email, name: session.user.name, role: session.user.role };
  next();
}
