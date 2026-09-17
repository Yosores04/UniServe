import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { hashSessionToken } from "../../middleware/authenticate.js";

export const sessionCookie = "uniserve_session";

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({ data: { userId, tokenHash: hashSessionToken(token), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) } });
  return token;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) return null;
  return { user, token: await createSession(user.id) };
}

export async function register(name: string, email: string, password: string, role: Role) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name: name.trim(), email: email.toLowerCase().trim(), passwordHash, role, customerProfile: role === "CUSTOMER" ? { create: {} } : undefined, riderProfile: role === "RIDER" ? { create: {} } : undefined } });
  return { user, token: await createSession(user.id) };
}
