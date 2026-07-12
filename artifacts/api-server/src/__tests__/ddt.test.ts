import { describe, it, expect } from "vitest";
import { processRecords } from "@workspace/agent-pipeline";
import { trainOnFeatureRows } from "@workspace/agent-pipeline";

describe("[ddt] processRecords across data-driven title cases", () => {
  const cases: { title: string; expectedHasNumber: boolean }[] = [
    { title: "Plain title with no digits", expectedHasNumber: false },
    { title: "Release version 2 is out", expectedHasNumber: true },
    { title: "100x faster builds", expectedHasNumber: true },
    { title: "Nothing numeric here at all", expectedHasNumber: false },
  ];

  it.each(cases)("hasNumber is $expectedHasNumber for '$title'", ({ title, expectedHasNumber }) => {
    const result = processRecords([{ title, score: 1, category: "tech", raw: {} }], []);
    expect(result.rows[0].hasNumber).toBe(expectedHasNumber);
  });
});

describe("[ddt] trainOnFeatureRows across score distributions", () => {
  const distributions = [
    { scores: [0, 0, 0], expectAvg: 0 },
    { scores: [1, 1, 1], expectAvg: 1 },
    { scores: [0, 1], expectAvg: 0.5 },
  ];

  it.each(distributions)("avgNormalizedScore is $expectAvg for scores $scores", ({ scores, expectAvg }) => {
    const rows = scores.map((score_normalized, i) => ({
      title: `topic keyword ${i}`,
      category: "news",
      score: 0,
      titleLength: 0,
      wordCount: 0,
      hasNumber: false,
      score_normalized,
    }));
    const result = trainOnFeatureRows(rows);
    expect(result.metrics.avgNormalizedScore).toBe(expectAvg);
  });
});
