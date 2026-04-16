export interface FuzzyResult {
  tag: string;
  score: number;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        i === 0
          ? j
          : a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function fuzzyMatch(query: string, vocabulary: string[]): FuzzyResult[] {
  if (!vocabulary.length || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  const results: FuzzyResult[] = [];

  for (const tag of vocabulary) {
    const t = tag.toLowerCase().trim();
    let score = 0;

    if (t === q) {
      score = 1.0;
    } else if (t.startsWith(q) || q.startsWith(t)) {
      score = 0.85;
    } else if (t.includes(q) || q.includes(t)) {
      score = 0.65;
    } else {
      const dist = levenshtein(q, t);
      const maxLen = Math.max(q.length, t.length);
      score = maxLen > 0 ? Math.max(0, 1 - dist / maxLen) : 0;
      if (score < 0.3) continue;
    }

    results.push({ tag, score });
  }

  return results.sort((a, b) => b.score - a.score);
}

export function bestFuzzyScore(query: string, vocabulary: string[]): number {
  const results = fuzzyMatch(query, vocabulary);
  return results.length > 0 ? results[0].score : 0;
}
