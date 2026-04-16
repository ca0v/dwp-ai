import { describe, it, expect, beforeEach } from "vitest";
import {
  resetStore,
  addPhoto,
  getPhotoById,
  getPhotosAll,
  addPhotoTag,
  getTagsForPhoto,
  approveTagsForPhoto,
  getPhotosByTags,
  getAllTagValues,
  getOrCreateTag,
  resolveUploadsDir,
} from "../src/data/store.ts";
import type { Tag } from "../src/data/types.ts";

beforeEach(() => {
  resetStore();
});

describe("addPhoto", () => {
  it("creates a photo with queued status", () => {
    const photo = addPhoto({ filename: "a.jpg", mimeType: "image/jpeg", size: 1000 });
    expect(photo.id).toBeDefined();
    expect(photo.status).toBe("queued");
    expect(photo.filename).toBe("a.jpg");
  });

  it("assigns unique IDs", () => {
    const a = addPhoto({ filename: "a.jpg", mimeType: "image/jpeg", size: 100 });
    const b = addPhoto({ filename: "b.jpg", mimeType: "image/jpeg", size: 100 });
    expect(a.id).not.toBe(b.id);
  });
});

describe("getPhotoById", () => {
  it("returns the photo by id", () => {
    const photo = addPhoto({ filename: "a.jpg", mimeType: "image/jpeg", size: 100 });
    expect(getPhotoById(photo.id)?.id).toBe(photo.id);
  });

  it("returns undefined for unknown id", () => {
    expect(getPhotoById("no-such-id")).toBeUndefined();
  });
});

describe("getPhotosAll", () => {
  it("returns all photos", () => {
    addPhoto({ filename: "a.jpg", mimeType: "image/jpeg", size: 100 });
    addPhoto({ filename: "b.jpg", mimeType: "image/jpeg", size: 100 });
    expect(getPhotosAll()).toHaveLength(2);
  });
});

describe("tags", () => {
  it("getOrCreateTag returns same tag for same value", () => {
    const t1 = getOrCreateTag("dog");
    const t2 = getOrCreateTag("dog");
    expect(t1.id).toBe(t2.id);
  });

  it("normalises tag value to lowercase", () => {
    const t = getOrCreateTag("Dog");
    expect(t.valueNormalized).toBe("dog");
  });
});

describe("addPhotoTag + getTagsForPhoto", () => {
  it("adds a tag to a photo", () => {
    const photo = addPhoto({ filename: "a.jpg", mimeType: "image/jpeg", size: 100 });
    addPhotoTag({ photoId: photo.id, tagValue: "cat", source: "ai", confidence: 0.9 });
    const tags = getTagsForPhoto(photo.id);
    expect(tags).toHaveLength(1);
    expect(tags[0]?.valueNormalized).toBe("cat");
  });

  it("does not duplicate the same photo-tag", () => {
    const photo = addPhoto({ filename: "a.jpg", mimeType: "image/jpeg", size: 100 });
    addPhotoTag({ photoId: photo.id, tagValue: "cat", source: "ai", confidence: 0.9 });
    addPhotoTag({ photoId: photo.id, tagValue: "cat", source: "ai", confidence: 0.9 });
    const tags = getTagsForPhoto(photo.id);
    expect(tags).toHaveLength(1);
  });
});

describe("approveTagsForPhoto", () => {
  it("marks provided tags as approved and sets status to ready", () => {
    const photo = addPhoto({ filename: "a.jpg", mimeType: "image/jpeg", size: 100 });
    addPhotoTag({ photoId: photo.id, tagValue: "dog", source: "ai", confidence: 0.8 });
    approveTagsForPhoto(photo.id, ["dog"]);
    const tags = getTagsForPhoto(photo.id, true);
    expect(tags.some((t: Tag) => t.valueNormalized === "dog")).toBe(true);
    expect(getPhotoById(photo.id)?.status).toBe("ready");
  });
});

describe("getPhotosByTags", () => {
  it("returns photos matching tag in OR mode", () => {
    const p = addPhoto({ filename: "a.jpg", mimeType: "image/jpeg", size: 100 });
    addPhotoTag({ photoId: p.id, tagValue: "beach", source: "ai", confidence: 0.9 });
    approveTagsForPhoto(p.id, ["beach"]);
    const results = getPhotosByTags(["beach"], "OR");
    expect(results.some((r) => r.id === p.id)).toBe(true);
  });

  it("AND mode returns only photos with all tags", () => {
    const p1 = addPhoto({ filename: "a.jpg", mimeType: "image/jpeg", size: 100 });
    const p2 = addPhoto({ filename: "b.jpg", mimeType: "image/jpeg", size: 100 });
    addPhotoTag({ photoId: p1.id, tagValue: "dog", source: "ai", confidence: 0.9 });
    addPhotoTag({ photoId: p1.id, tagValue: "park", source: "ai", confidence: 0.9 });
    addPhotoTag({ photoId: p2.id, tagValue: "dog", source: "ai", confidence: 0.9 });
    approveTagsForPhoto(p1.id, ["dog", "park"]);
    approveTagsForPhoto(p2.id, ["dog"]);
    const results = getPhotosByTags(["dog", "park"], "AND");
    const ids = results.map((r) => r.id);
    expect(ids).toContain(p1.id);
    expect(ids).not.toContain(p2.id);
  });
});

describe("getAllTagValues", () => {
  it("returns distinct tag values", () => {
    getOrCreateTag("cat");
    getOrCreateTag("dog");
    getOrCreateTag("cat"); // duplicate
    expect(getAllTagValues()).toHaveLength(2);
  });
});

describe("resolveUploadsDir", () => {
  it("uses configured absolute path when provided", () => {
    const configured = "/var/data/uploads";
    expect(resolveUploadsDir(configured, "/repo")).toBe("/var/data/uploads");
  });

  it("resolves configured relative path from cwd", () => {
    expect(resolveUploadsDir("uploads-demo", "/repo")).toMatch(/uploads-demo$/);
  });

  it("falls back to rootDir/uploads when unset", () => {
    expect(resolveUploadsDir(undefined, "/repo")).toBe("/repo/uploads");
  });
});
