import { describe, it, expect, beforeEach } from "vitest";
import {
  resetStore,
  addPhoto,
  addPhotoTag,
  approveTagsForPhoto,
  getPhotosByTags,
} from "../src/data/store.ts";

beforeEach(() => {
  resetStore();
});

function makePhotoWithTags(filename: string, tags: string[]) {
  const photo = addPhoto({ filename, mimeType: "image/jpeg", size: 1000 });
  for (const tag of tags) {
    addPhotoTag({ photoId: photo.id, tagValue: tag, source: "ai", confidence: 0.9 });
  }
  approveTagsForPhoto(photo.id, tags);
  return photo;
}

describe("getPhotosByTags OR mode", () => {
  it("returns photos that have any of the requested tags", () => {
    const p1 = makePhotoWithTags("a.jpg", ["dog", "park"]);
    const p2 = makePhotoWithTags("b.jpg", ["cat"]);
    const results = getPhotosByTags(["dog"], "OR");
    const ids = results.map((p) => p.id);
    expect(ids).toContain(p1.id);
    expect(ids).not.toContain(p2.id);
  });

  it("matches multiple OR tags", () => {
    const p1 = makePhotoWithTags("a.jpg", ["dog"]);
    const p2 = makePhotoWithTags("b.jpg", ["cat"]);
    const p3 = makePhotoWithTags("c.jpg", ["bird"]);
    const results = getPhotosByTags(["dog", "cat"], "OR");
    const ids = results.map((p) => p.id);
    expect(ids).toContain(p1.id);
    expect(ids).toContain(p2.id);
    expect(ids).not.toContain(p3.id);
  });
});

describe("getPhotosByTags AND mode", () => {
  it("only returns photos that have ALL tags", () => {
    const p1 = makePhotoWithTags("a.jpg", ["dog", "park"]);
    const p2 = makePhotoWithTags("b.jpg", ["dog"]);
    const results = getPhotosByTags(["dog", "park"], "AND");
    const ids = results.map((p) => p.id);
    expect(ids).toContain(p1.id);
    expect(ids).not.toContain(p2.id);
  });
});

describe("getPhotosByTags edge cases", () => {
  it("returns empty when no photos match", () => {
    makePhotoWithTags("a.jpg", ["dog"]);
    expect(getPhotosByTags(["shark"], "OR")).toHaveLength(0);
  });

  it("normalises tag query to lowercase", () => {
    const p = makePhotoWithTags("a.jpg", ["dog"]);
    const results = getPhotosByTags(["DOG"], "OR");
    expect(results.some((r) => r.id === p.id)).toBe(true);
  });
});
