import { describe, it, expect, vi } from "vitest";

vi.mock("bun", async () => ({}));

describe("getActiveProfile", () => {
  it("returns general profile by default", async () => {
    const { getActiveProfile } = await import("../src/ai/profiles.ts");
    const profile = getActiveProfile();
    expect(profile.name).toBeDefined();
    expect(typeof profile.systemPrompt).toBe("string");
    expect(profile.systemPrompt.length).toBeGreaterThan(10);
  });

  it("getActiveSystemPrompt returns a non-empty string", async () => {
    const { getActiveSystemPrompt } = await import("../src/ai/profiles.ts");
    const prompt = getActiveSystemPrompt();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(10);
  });
});
