import type { Role } from "../types";

const rolePaths: Record<Role, string> = {
  customer: "/customer",
  courier: "/rider",
  store: "/shop",
  admin: "/admin"
};

export function rolePath(role: Role) {
  return rolePaths[role];
}

export function roleForPath(pathname: string): Role | null {
  const match = Object.entries(rolePaths).find(([, path]) => pathname === path || pathname.startsWith(`${path}/`));
  return (match?.[0] as Role | undefined) ?? null;
}

export function canAccessPath(role: Role, pathname: string) {
  const requiredRole = roleForPath(pathname);
  return requiredRole === null || requiredRole === role;
}
