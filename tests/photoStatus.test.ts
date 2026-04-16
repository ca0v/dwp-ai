import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  statusLabel,
  statusIcon,
} from "../src/data/photoStatus.ts";
import type { PhotoStatus } from "../src/data/types.ts";

describe("canTransition", () => {
  it("allows queued → analyzing", () => {
    expect(canTransition("queued", "analyzing")).toBe(true);
  });
  it("allows analyzing → needs-review", () => {
    expect(canTransition("analyzing", "needs-review")).toBe(true);
  });
  it("allows needs-review → ready", () => {
    expect(canTransition("needs-review", "ready")).toBe(true);
  });
  it("disallows queued → ready directly", () => {
    expect(canTransition("queued", "ready")).toBe(false);
  });
  it("allows any state → error", () => {
    const statuses: PhotoStatus[] = ["queued", "analyzing", "needs-review", "ready"];
    for (const s of statuses) {
      expect(canTransition(s, "error")).toBe(true);
    }
  });
  it("allows error → queued (retry)", () => {
    expect(canTransition("error", "queued")).toBe(true);
  });
});

describe("assertTransition", () => {
  it("throws on invalid transition", () => {
    expect(() => assertTransition("ready", "analyzing")).toThrow();
  });
  it("does not throw on valid transition", () => {
    expect(() => assertTransition("queued", "analyzing")).not.toThrow();
  });
});

describe("statusLabel", () => {
  it("returns a non-empty label", () => {
    const statuses: PhotoStatus[] = ["queued", "analyzing", "needs-review", "ready", "error"];
    for (const s of statuses) {
      expect(statusLabel(s).length).toBeGreaterThan(0);
    }
  });
});

describe("statusIcon", () => {
  it("returns a non-empty icon", () => {
    expect(statusIcon("ready").length).toBeGreaterThan(0);
  });
});
