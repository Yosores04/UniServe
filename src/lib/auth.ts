import type { Role } from "../types";

export type AuthUser = {
  id?: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string };

export function signIn(email: string, password: string): AuthResult {
  if (!email.trim() || !password.trim()) {
    return { ok: false, message: "Enter your email and password." };
  }

  return {
    ok: true,
    user: { name: "Demo User", email: email.trim(), role: "customer" }
  };
}

export function signUp(name: string, email: string, password: string, role: Role): AuthResult {
  if (!name.trim() || !email.trim() || password.length < 6) {
    return { ok: false, message: "Enter your details and a password with at least 6 characters." };
  }

  return { ok: true, user: { name: name.trim(), email: email.trim(), role } };
}

export function signInWithGoogleDemo(): AuthUser {
  return { name: "User", email: "demo@buksu.edu.ph", role: "customer" };
}