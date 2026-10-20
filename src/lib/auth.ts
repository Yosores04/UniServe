import type { Role } from "../types";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};
