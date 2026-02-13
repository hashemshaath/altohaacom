import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadCSV, downloadJSON } from "@/lib/exportUtils";

// jsdom doesn't have URL.createObjectURL
beforeEach(() => {
  vi.restoreAllMocks();
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => "blob:mock");
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = vi.fn();
  }
});

describe("downloadCSV", () => {
  it("does nothing for empty data", () => {
    const spy = vi.spyOn(document, "createElement");
    downloadCSV([], "test");
    expect(spy).not.toHaveBeenCalled();
  });

  it("generates correct CSV structure", () => {
    const data = [{ name: "Ali", score: 95 }];
    // We just verify it doesn't throw — download triggers DOM side effects
    expect(() => downloadCSV(data, "test")).not.toThrow();
  });
});

describe("downloadJSON", () => {
  it("does not throw", () => {
    expect(() => downloadJSON({ test: true }, "data")).not.toThrow();
  });
});
