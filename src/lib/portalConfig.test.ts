import { describe, expect, it } from "vitest";
import { portalConfigs, roleOrder } from "./portalConfig";

describe("portal configuration", () => {
  it("defines a separate demo interface for every BukSU Courier user type", () => {
    expect(roleOrder).toEqual(["customer", "courier", "store", "admin"]);

    const paths = portalConfigs.map((portal) => portal.path);
    expect(new Set(paths).size).toBe(4);
    expect(paths).toEqual(["/student", "/courier", "/entrepreneur", "/admin"]);
  });

  it("keeps customer wording student-friendly", () => {
    const customerPortal = portalConfigs.find((portal) => portal.role === "customer");

    expect(customerPortal?.audience).toContain("Students");
    expect(customerPortal?.primaryAction).toBe("Request delivery");
  });
});
