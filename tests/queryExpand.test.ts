import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetStore } from "../src/data/store.ts";

vi.mock("../src/ai/config.ts", () => ({
  getProvider: () => ({
    tagImage: async () => [],
    expandQuery: async (_query: string, vocabulary: string[]) => vocabulary.slice(0, 2),
  }),
  resetProvider: vi.fn(),
}));

beforeEach(() => {
  resetStore();
});

describe("expandQuery", () => {
  it("returns local fuzzy matches without calling AI when threshold is met", async () => {
    const { expandQuery } = await import("../src/ai/queryExpand.ts");
    // Populate store with vocabulary tags via a photo approval
    const { addPhoto, addPhotoTag, approveTagsForPhoto } = await import("../src/data/store.ts");
    const photo = addPhoto({ filename: "a.jpg", mimeType: "image/jpeg", size: 100 });
    addPhotoTag({ photoId: photo.id, tagValue: "dog", source: "ai", confidence: 0.9 });
    approveTagsForPhoto(photo.id, ["dog"]);

    const result = await expandQuery("dog");
    expect(result.tags).toContain("dog");
    expect(result.source).toBe("local");
  });

  it("returns object with tags, source, and cached fields", async () => {
    const { expandQuery } = await import("../src/ai/queryExpand.ts");
    const result = await expandQuery("sunset");
    expect(result).toHaveProperty("tags");
    expect(result).toHaveProperty("source");
    expect(result).toHaveProperty("cached");
    expect(Array.isArray(result.tags)).toBe(true);
  });
});
