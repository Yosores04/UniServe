import { apiRequest } from "./apiClient";
import type { AuthUser } from "./auth";
import type { Role } from "../types";

type ServerRole = "CUSTOMER" | "RIDER" | "SHOP" | "ADMIN";
type ServerUser = { id: string; name: string; email: string; role: ServerRole };

function toAuthUser(user: ServerUser): AuthUser {
  const roleMap: Record<ServerRole, Role> = { CUSTOMER: "customer", RIDER: "courier", SHOP: "store", ADMIN: "admin" };
  return { id: user.id, name: user.name, email: user.email, role: roleMap[user.role] };
}

export async function getCurrentUser() {
  const response = await apiRequest<{ user: ServerUser }>("/api/auth/me");
  return toAuthUser(response.user);
}

export async function loginWithApi(email: string, password: string) {
  const response = await apiRequest<{ user: ServerUser }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  return toAuthUser(response.user);
}

export async function registerWithApi(name: string, email: string, password: string, role: Role) {
  const roleMap: Record<Role, ServerRole> = { customer: "CUSTOMER", courier: "RIDER", store: "SHOP", admin: "ADMIN" };
  const response = await apiRequest<{ user: ServerUser }>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, role: roleMap[role] }) });
  return toAuthUser(response.user);
}

export async function logoutFromApi() {
  await apiRequest<void>("/api/auth/logout", { method: "POST" });
}
