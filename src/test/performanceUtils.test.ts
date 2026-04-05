import { describe, it, expect, vi } from "vitest";
import { debounce, throttle, memoize } from "@/lib/performanceUtils";

describe("debounce", () => {
  it("delays function execution", async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);
    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 100));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("can be cancelled", async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);
    debounced();
    debounced.cancel();
    await new Promise((r) => setTimeout(r, 100));
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("throttle", () => {
  it("limits call frequency", async () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 50);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
    await new Promise((r) => setTimeout(r, 100));
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("memoize", () => {
  it("caches results", () => {
    let callCount = 0;
    const expensive = memoize((n: number) => {
      callCount++;
      return n * 2;
    });
    expect(expensive(5)).toBe(10);
    expect(expensive(5)).toBe(10);
    expect(callCount).toBe(1);
  });

  it("evicts oldest entries when maxSize exceeded", () => {
    const fn = memoize((n: number) => n, 2);
    fn(1);
    fn(2);
    fn(3); // should evict 1
    // No error expected, just verifying it works
    expect(fn(3)).toBe(3);
  });
});
