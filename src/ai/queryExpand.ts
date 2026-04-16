import { getAllTagValues } from "../data/store.ts";
import { findCachedQuery, logSearchQuery } from "../data/store.ts";
import { fuzzyMatch, bestFuzzyScore } from "./fuzzy.ts";
import { getProvider } from "./config.ts";

const THRESHOLD = Number(process.env.AI_FUZZY_THRESHOLD ?? 0.6);

export interface ExpandResult {
  tags: string[];
  source: "local" | "ai";
  cached: boolean;
}

export async function expandQuery(query: string): Promise<ExpandResult> {
  const vocabulary = getAllTagValues();

  // 1. Try local fuzzy first
  const localResults = fuzzyMatch(query, vocabulary);
  const localScore = localResults.length > 0 ? localResults[0].score : 0;

  if (localScore >= THRESHOLD) {
    const tags = localResults.filter((r) => r.score >= THRESHOLD).map((r) => r.tag);
    return { tags, source: "local", cached: false };
  }

  // 2. Check cache
  const cached = findCachedQuery(query);
  if (cached) {
    return {
      tags: cached.resolvedTags,
      source: "ai",
      cached: true,
    };
  }

  // 3. Fall back to AI expansion
  if (!vocabulary.length) {
    return { tags: [], source: "local", cached: false };
  }

  let aiTags: string[] = [];
  try {
    const provider = getProvider();
    aiTags = await provider.expandQuery(query, vocabulary);
  } catch {
    // If AI call fails, fall back to best local results
    aiTags = localResults.slice(0, 5).map((r) => r.tag);
  }

  // Cache the result
  logSearchQuery({
    queryText: query,
    resolvedTags: aiTags,
    resultCount: 0, // updated later by caller
  });

  return { tags: aiTags, source: "ai", cached: false };
}
