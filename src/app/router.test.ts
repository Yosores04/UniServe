import { describe, expect, it } from "vitest";
import { canAccessPath, roleForPath, rolePath } from "./router";

describe("role route authorization", () => {
  it("maps each role to its protected route", () => {
    expect(rolePath("customer")).toBe("/customer");
    expect(roleForPath("/rider/jobs")).toBe("courier");
  });

  it("rejects a role from another role's route", () => {
    expect(canAccessPath("customer", "/admin/users")).toBe(false);
    expect(canAccessPath("admin", "/admin/users")).toBe(true);
  });
});
