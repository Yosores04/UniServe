import { describe, expect, it } from "vitest";
import { getWorkspaceNavigation, resolveWorkspaceSection } from "./workspaceNavigation";

describe("role workspace navigation", () => {
  it("makes the customer profile a persistent destination", () => {
    expect(getWorkspaceNavigation("customer").sections.map(({ label }) => label)).toEqual(["Browse", "My orders", "Profile"]);
    expect(resolveWorkspaceSection("customer", "profile")).toBe("profile");
  });
  it("opens each role on its primary task", () => {
    expect(resolveWorkspaceSection("customer", "")).toBe("marketplace");
    expect(resolveWorkspaceSection("store", "")).toBe("orders");
    expect(resolveWorkspaceSection("courier", "")).toBe("jobs");
    expect(resolveWorkspaceSection("admin", "")).toBe("overview");
  });

  it("rejects a saved section that does not belong to the authenticated role", () => {
    expect(resolveWorkspaceSection("customer", "approvals")).toBe("marketplace");
    expect(resolveWorkspaceSection("store", "products")).toBe("products");
    expect(getWorkspaceNavigation("courier").sections.map((section) => section.id)).toEqual(["jobs", "deliveries", "history"]);
  });
});
