import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiError } from "./apiClient";

const native = vi.hoisted(() => ({ getPlatform: vi.fn(() => "web"), request: vi.fn() }));
vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform: native.getPlatform }, CapacitorHttp: { request: native.request } }));

afterEach(() => {
  native.getPlatform.mockReturnValue("web");
  native.request.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("API requests", () => {
  it("sends browser requests to the relative proxy path with cookies", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    await apiRequest("/api/workspace");
    expect(fetch).toHaveBeenCalledWith("/api/workspace", expect.objectContaining({ credentials: "include" }));
    expect(native.request).not.toHaveBeenCalled();
  });
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

describe("Android API requests", () => {
  beforeEach(() => {
    native.getPlatform.mockReturnValue("android");
    vi.stubEnv("VITE_MOBILE_API_ORIGIN", "http://10.0.2.2:3001");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("unexpected web request")));
  });

  it("sends JSON to the configured server through native HTTP", async () => {
    native.request.mockResolvedValue({ status: 200, data: { ok: true } });
    await expect(apiRequest("/api/auth/login", { method: "POST", body: '{"name":"Student"}' })).resolves.toEqual({ ok: true });
    expect(native.request).toHaveBeenCalledWith(expect.objectContaining({
      url: "http://10.0.2.2:3001/api/auth/login", method: "POST", data: { name: "Student" },
      headers: expect.objectContaining({ "content-type": "application/json" }),
      connectTimeout: 15000, readTimeout: 15000
    }));
  });

  it("preserves the server message and status on expired sessions", async () => {
    native.request.mockResolvedValue({ status: 401, data: '{"message":"Sign in again."}' });
    await expect(apiRequest("/api/workspace")).rejects.toMatchObject({ status: 401, message: "Sign in again." });
  });

  it("accepts an empty 204 after logout", async () => {
    native.request.mockResolvedValue({ status: 204, data: "" });
    await expect(apiRequest("/api/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("reports a malformed response with its HTTP status", async () => {
    native.request.mockResolvedValue({ status: 200, data: "<html>Unavailable</html>" });
    await expect(apiRequest("/api/workspace")).rejects.toMatchObject({ status: 200, message: expect.stringContaining("API is unavailable") });
  });

  it("bounds a stalled write even when the native bridge remains pending", async () => {
    vi.useFakeTimers();
    native.request.mockReturnValue(new Promise(() => {}));
    const result = apiRequest("/api/customer/orders", { method: "POST", body: "{}" }).catch(error => error);
    expect(native.request).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15000);
    await expect(result).resolves.toMatchObject({ status: 0, message: expect.stringContaining("may have been saved") });
  });

  it("discards a response arriving after cancellation", async () => {
    let finish!: (response: unknown) => void;
    native.request.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const controller = new AbortController();
    const result = apiRequest("/api/workspace", { signal: controller.signal }).catch(error => error);
    expect(native.request).toHaveBeenCalledTimes(1);
    controller.abort();
    finish({ status: 200, data: { stale: true } });
    await expect(result).resolves.toMatchObject({ status: 0 });
  });

  it("skips a request cancelled before dispatch", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(apiRequest("/api/workspace", { signal: controller.signal })).rejects.toMatchObject({ status: 0 });
    expect(native.request).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a destination outside the configured origin", async () => {
    await expect(apiRequest("//another.example/api")).rejects.toBeInstanceOf(ApiError);
    expect(native.request).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
