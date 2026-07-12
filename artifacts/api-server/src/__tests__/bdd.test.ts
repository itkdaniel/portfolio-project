import { describe, it, expect } from "vitest";
import { trainOnFeatureRows } from "@workspace/agent-pipeline";

describe("Feature: trending topic training", () => {
  describe("Given a set of scraped titles sharing a common keyword", () => {
    const rows = [
      { title: "AI agents are trending", category: "tech", score: 0, titleLength: 0, wordCount: 0, hasNumber: false, score_normalized: 0.9 },
      { title: "New AI model released", category: "tech", score: 0, titleLength: 0, wordCount: 0, hasNumber: false, score_normalized: 0.8 },
      { title: "Weather report for today", category: "news", score: 0, titleLength: 0, wordCount: 0, hasNumber: false, score_normalized: 0.1 },
    ];

    it("When the agent trains on the feature rows, Then the shared keyword ranks as a top predicted topic", () => {
      const result = trainOnFeatureRows(rows);
      const topics = result.predictedTopics.map((t: { topic: string }) => t.topic);

      expect(result.predictedTopics.length).toBeGreaterThan(0);
      expect(result.predictedTopics[0].score).toBeGreaterThan(0);
      expect(topics).toContain("agents");
    });
  });

  describe("Given no scraped rows at all", () => {
    it("When the agent trains on an empty feature set, Then it returns zero topics without throwing", () => {
      const result = trainOnFeatureRows([]);
      expect(result.predictedTopics).toEqual([]);
      expect(result.metrics.totalRows).toBe(0);
    });
  });
});
