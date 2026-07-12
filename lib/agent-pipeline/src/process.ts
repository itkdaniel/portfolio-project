import type { ScrapedRecord } from "./scrape";

export interface FeatureRow {
  title: string;
  category: string;
  score: number;
  titleLength: number;
  wordCount: number;
  hasNumber: boolean;
  score_normalized: number;
}

export const AVAILABLE_FEATURES = [
  "title",
  "category",
  "score",
  "titleLength",
  "wordCount",
  "hasNumber",
  "score_normalized",
] as const;

export interface ProcessResult {
  rows: FeatureRow[];
  featureNames: string[];
  csv: string;
}

export function processRecords(
  records: ScrapedRecord[],
  requestedFeatures: string[],
): ProcessResult {
  const scores = records.map((r) => r.score);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 1);
  const range = max - min || 1;

  const rows: FeatureRow[] = records.map((r) => ({
    title: r.title,
    category: r.category,
    score: r.score,
    titleLength: r.title.length,
    wordCount: r.title.trim().split(/\s+/).filter(Boolean).length,
    hasNumber: /\d/.test(r.title),
    score_normalized: Number(((r.score - min) / range).toFixed(4)),
  }));

  const featureNames =
    requestedFeatures.length > 0
      ? requestedFeatures.filter((f) =>
          (AVAILABLE_FEATURES as readonly string[]).includes(f),
        )
      : [...AVAILABLE_FEATURES];

  const usedFeatures = featureNames.length > 0 ? featureNames : [...AVAILABLE_FEATURES];

  const header = usedFeatures.join(",");
  const csvLines = rows.map((row) =>
    usedFeatures
      .map((f) => {
        const value = (row as unknown as Record<string, unknown>)[f];
        const cell = String(value ?? "").replace(/"/g, '""');
        return cell.includes(",") ? `"${cell}"` : cell;
      })
      .join(","),
  );

  return {
    rows,
    featureNames: usedFeatures,
    csv: [header, ...csvLines].join("\n"),
  };
}
