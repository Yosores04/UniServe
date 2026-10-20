import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiError } from "./apiClient";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("API requests", () => {
  it("preserves the HTTP status for expired-session handling", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Sign in is required." }), { status: 401 })));
    await expect(apiRequest("/api/workspace")).rejects.toMatchObject({ status: 401, message: "Sign in is required." });
  });

  it("handles an empty logout response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(apiRequest("/api/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("reports an unavailable API when a proxy returns HTML", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Unavailable</html>", { status: 502 })));
    await expect(apiRequest("/api/workspace")).rejects.toBeInstanceOf(ApiError);
  });

  it("times out a stalled request so phone reconnection can recover", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", (_path: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    let result: unknown = "pending";
    void apiRequest("/api/customer/orders", { method: "POST", body: "{}" }).then(() => { result = "success"; }, (error) => { result = error; });
    await vi.advanceTimersByTimeAsync(15000);
    expect(result).toMatchObject({ status: 0, message: expect.stringContaining("may have been saved") });
  });
});
