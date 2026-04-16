import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetStore, addPhoto, getPhotoById } from "../src/data/store.ts";

// Mock the AI provider to avoid real API calls in unit tests
vi.mock("../src/ai/config.ts", () => ({
  getProvider: () => ({
    tagImage: async () => [
      { tag: "dog", confidence: 0.9 },
      { tag: "park", confidence: 0.8 },
    ],
    expandQuery: async () => ["dog"],
  }),
  resetProvider: vi.fn(),
}));

// Mock the profiles module
vi.mock("../src/ai/profiles.ts", () => ({
  getActiveSystemPrompt: () => "Mock system prompt",
}));

// Mock Bun.file to avoid file system access
vi.mock("bun", () => ({
  file: () => ({
    exists: async () => true,
    arrayBuffer: async () => {
      // Return a minimal JPEG buffer
      return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).buffer;
    },
  }),
}));

beforeEach(() => {
  resetStore();
});

describe("triggerTagging", () => {
  it("is importable", async () => {
    const { triggerTagging } = await import("../src/ai/tagging.ts");
    expect(typeof triggerTagging).toBe("function");
  });
});
