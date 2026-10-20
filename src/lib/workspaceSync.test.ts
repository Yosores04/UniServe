import { describe, expect, it } from "vitest";
import { createWorkspaceSync } from "./workspaceSync";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe("shared workspace synchronization", () => {
  it("coalesces overlapping refreshes and ignores responses after disposal", async () => {
    const pending = deferred<number>();
    const values: number[] = [];
    let reads = 0;
    const sync = createWorkspaceSync(async () => { reads++; return pending.promise; }, (value) => values.push(value), () => {});
    const first = sync.refresh();
    const second = sync.refresh();
    expect(reads).toBe(1);
    sync.dispose();
    pending.resolve(1);
    await Promise.all([first, second]);
    expect(values).toEqual([]);
  });

  it("refreshes after writes and prevents repeat submissions", async () => {
    let saved = 1;
    const pending = deferred<void>();
    const values: number[] = [];
    const sync = createWorkspaceSync(async () => saved, (value) => values.push(value), () => {});
    await sync.refresh();
    const write = sync.mutate(async () => { await pending.promise; saved = 2; });
    expect(await sync.mutate(async () => { saved = 99; })).toBe(false);
    pending.resolve();
    expect(await write).toBe(true);
    expect(values).toEqual([1, 2]);
  });

  it("retains the previous data and reports mutation failures", async () => {
    const values: number[] = [];
    const errors: string[] = [];
    const sync = createWorkspaceSync(async () => 1, (value) => values.push(value), (error) => errors.push(error.message));
    await sync.refresh();
    expect(await sync.mutate(async () => { throw new Error("Shop is closed."); })).toBe(false);
    expect(values).toEqual([1, 1]);
    expect(errors).toEqual(["Shop is closed."]);
  });

  it("finishes an old read before refreshing a committed change", async () => {
    const oldRead = deferred<number>();
    const values: number[] = [];
    let reads = 0;
    const sync = createWorkspaceSync(async () => ++reads === 1 ? oldRead.promise : 2, (value) => values.push(value), () => {});
    const polling = sync.refresh();
    const saved = sync.mutate(async () => {});
    oldRead.resolve(1);
    await polling;
    expect(await saved).toBe(true);
    expect(values).toEqual([1, 2]);
  });
});
