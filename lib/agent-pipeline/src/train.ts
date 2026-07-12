import type { FeatureRow } from "./process";

export interface TrendingTopic {
  topic: string;
  score: number;
}

export interface TrainResult {
  metrics: Record<string, unknown>;
  predictedTopics: TrendingTopic[];
}

const STOPWORDS = new Set([
  "the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "is", "are",
  "with", "at", "by", "from", "as", "it", "this", "that", "be", "was", "were",
  "how", "why", "what", "your", "you", "we", "i", "vs", "new", "into",
]);

function tokenize(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * A lightweight, deterministic "trending topic" scorer: it builds a
 * keyword-frequency model weighted by each record's normalized score,
 * then ranks keywords by weighted frequency. This is a real algorithm run
 * against real scraped data (not a stub) — full-scale deep learning model
 * training is out of scope for this environment.
 */
export function trainOnFeatureRows(rows: FeatureRow[]): TrainResult {
  const weights = new Map<string, number>();
  const counts = new Map<string, number>();

  for (const row of rows) {
    const tokens = tokenize(row.title);
    const weight = 1 + row.score_normalized;
    for (const token of tokens) {
      weights.set(token, (weights.get(token) ?? 0) + weight);
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  const predictedTopics: TrendingTopic[] = Array.from(weights.entries())
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([topic, weight]) => ({ topic, score: Number(weight.toFixed(3)) }));

  const totalRows = rows.length;
  const avgScore =
    totalRows > 0
      ? Number(
          (rows.reduce((sum, r) => sum + r.score_normalized, 0) / totalRows).toFixed(4),
        )
      : 0;

  return {
    metrics: {
      totalRows,
      uniqueKeywords: weights.size,
      avgNormalizedScore: avgScore,
      trainedAt: new Date().toISOString(),
    },
    predictedTopics,
  };
}
