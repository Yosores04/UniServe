export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(path, { ...options, credentials: "include", headers, signal: controller.signal });
    if (response.status === 204) return undefined as T;
    const payload = await response.json().catch(() => null) as (T & { message?: string }) | null;
    if (!response.ok) throw new ApiError(payload?.message ?? "The server could not complete the request. Please try again.", response.status);
    if (payload === null) throw new ApiError("The API is unavailable. Check that the backend is running.", response.status);
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
