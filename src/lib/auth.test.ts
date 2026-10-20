import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, loginWithApi, registerWithApi } from "./authClient";

afterEach(() => vi.unstubAllGlobals());

describe("server-authenticated identity", () => {
  it("uses the server role when signing in", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: { id: "seller-1", name: "Seller", email: "seller@campus.local", role: "SHOP" } }))));
    await expect(loginWithApi("seller@campus.local", "password123")).resolves.toMatchObject({ id: "seller-1", role: "store" });
  });

  it("requests a seller account through server registration", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: { id: "seller-2", name: "New Seller", email: "new@campus.local", role: "SHOP" } })));
    vi.stubGlobal("fetch", fetcher);
    await expect(registerWithApi("New Seller", "new@campus.local", "password123", "store")).resolves.toMatchObject({ id: "seller-2", role: "store" });
    expect(JSON.parse(fetcher.mock.calls[0][1].body).role).toBe("SHOP");
  });

  it("rejects expired sessions without fabricating a user", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Sign in is required." }), { status: 401 })));
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401 });
  });
});
