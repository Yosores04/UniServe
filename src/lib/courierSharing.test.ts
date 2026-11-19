import { expect, it, vi } from "vitest";
import { startCourierSharing } from "./courierSharing";

it("clears GPS immediately and removes the location after an in-flight update", async () => {
  let fix!: PositionCallback;
  const gps = {
    watchPosition(callback: PositionCallback) { fix = callback; return 42; },
    clearWatch: vi.fn(),
  };
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  const write = vi.fn(async (_path: string, options: RequestInit) => {
    if (options.method === "PATCH") await pending;
  });
  const session = startCourierSharing("order-1", gps, write, vi.fn());
  const point = { coords: { latitude: 8.15, longitude: 125.12 }, timestamp: Date.now() } as GeolocationPosition;
  fix(point);
  await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
  const stopped = session.stop();
  fix(point);
  expect(gps.clearWatch).toHaveBeenCalledWith(42);
  expect(write).toHaveBeenCalledTimes(1);
  finish();
  await stopped;
  await session.stop();
  expect(write.mock.calls.map(([, options]) => options.method)).toEqual(["PATCH", "DELETE"]);
});

it("stops on denied permission and ignores any later GPS fix", async () => {
  let fail!: PositionErrorCallback;
  let fix!: PositionCallback;
  const gps = {
    watchPosition(next: PositionCallback, error?: PositionErrorCallback | null) {
      fix = next;
      fail = error!;
      return 0;
    },
    clearWatch: vi.fn(),
  };
  const write = vi.fn(async (_path: string, _options: RequestInit) => {});
  const report = vi.fn();
  const session = startCourierSharing("denied", gps, write, report);
  fail({ code: 1 } as GeolocationPositionError);
  fix({} as GeolocationPosition);
  await session.stop();
  expect(gps.clearWatch).toHaveBeenCalledWith(0);
  expect(report).toHaveBeenCalledWith(expect.stringContaining("permission was denied"), true);
  expect(write.mock.calls.map(([, options]) => options.method)).toEqual(["DELETE"]);
});
