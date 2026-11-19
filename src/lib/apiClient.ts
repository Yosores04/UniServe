/// <reference types="vite/client" />
import { Capacitor, CapacitorHttp } from "@capacitor/core";

const requestTimeout = 15000;

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function androidRequest(path: string, options: RequestInit, headers: Headers, signal: AbortSignal) {
  signal.throwIfAborted();
  const origin = new URL(import.meta.env.VITE_MOBILE_API_ORIGIN);
  const url = new URL(path, origin);
  if (url.origin !== origin.origin || !["http:", "https:"].includes(origin.protocol) || url.username || url.password) {
    throw new ApiError("Invalid mobile API destination.", 0);
  }

  const cancelled = new Promise<never>((_, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });
  const { status, data } = await Promise.race([cancelled, CapacitorHttp.request({
    url: url.href,
    method: options.method ?? "GET",
    headers: Object.fromEntries(headers),
    data: options.body ? JSON.parse(String(options.body)) : undefined,
    connectTimeout: requestTimeout,
    readTimeout: requestTimeout,
    disableRedirects: true
  })]);
  if (typeof data !== "string") return { status, payload: data };
  try {
    return { status, payload: JSON.parse(data) };
  } catch {
    return { status, payload: null };
  }
}

async function browserRequest(path: string, options: RequestInit, headers: Headers, signal: AbortSignal) {
  const response = await fetch(path, { ...options, credentials: "include", headers, signal });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  return { status: response.status, payload };
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, requestTimeout);
  try {
    const request = Capacitor.getPlatform() === "android" ? androidRequest : browserRequest;
    const { status, payload } = await request(path, options, headers, controller.signal);
    if (status === 204) return undefined as T;
    if (status < 200 || status >= 300) throw new ApiError(payload?.message ?? "The server could not complete the request. Please try again.", status);
    if (payload == null) throw new ApiError("The API is unavailable. Check that the backend is running.", status);
    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const writing = options.method && !["GET", "HEAD"].includes(options.method.toUpperCase());
    throw new ApiError(writing ? "Connection interrupted. Your change may have been saved. Refresh to check before submitting again." : "Connection interrupted. Check the laptop and Wi-Fi; retrying shortly.", 0);
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
