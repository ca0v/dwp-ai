import { describe, it, expect } from "vitest";
import { fuzzyMatch, bestFuzzyScore } from "../src/ai/fuzzy.ts";

describe("fuzzyMatch", () => {
  it("exact match scores 1.0", () => {
    const results = fuzzyMatch("dog", ["dog", "cat", "bird"]);
    const dog = results.find((r) => r.tag === "dog");
    expect(dog?.score).toBe(1.0);
  });

  it("prefix match scores ≥ 0.8", () => {
    const results = fuzzyMatch("do", ["dog", "dove", "cat"]);
    for (const r of results.filter((r) => r.tag === "dog" || r.tag === "dove")) {
      expect(r.score).toBeGreaterThanOrEqual(0.8);
    }
  });

  it("substring match scores ≥ 0.6", () => {
    const results = fuzzyMatch("ach", ["beach", "reach", "cat"]);
    const beach = results.find((r) => r.tag === "beach");
    expect(beach).toBeDefined();
    expect(beach!.score).toBeGreaterThanOrEqual(0.5);
  });

  it("is case-insensitive", () => {
    const results = fuzzyMatch("DOG", ["dog"]);
    expect(results[0]?.score).toBe(1.0);
  });

  it("excludes very dissimilar words", () => {
    const results = fuzzyMatch("xyz", ["dog", "cat", "bird"]);
    // Scores should all be below threshold
    for (const r of results) {
      expect(r.score).toBeLessThan(0.5);
    }
  });

  it("returns results sorted by score descending", () => {
    const results = fuzzyMatch("cat", ["catch", "cat", "scatter"]);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
    }
  });

  it("returns empty for empty vocabulary", () => {
    expect(fuzzyMatch("dog", [])).toHaveLength(0);
  });
});

describe("bestFuzzyScore", () => {
  it("returns the top score", () => {
    const score = bestFuzzyScore("dog", ["cat", "dog", "bird"]);
    expect(score).toBe(1.0);
  });

  it("returns 0 for empty vocabulary", () => {
    expect(bestFuzzyScore("dog", [])).toBe(0);
  });
});
