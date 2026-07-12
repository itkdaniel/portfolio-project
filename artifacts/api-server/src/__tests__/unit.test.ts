import { describe, it, expect } from "vitest";
import { processRecords } from "@workspace/agent-pipeline";
import { encryptField, decryptField } from "../lib/encryption";

describe("[unit] processRecords", () => {
  it("computes title length and word count features", () => {
    const result = processRecords(
      [{ title: "Hello World", score: 10, category: "news", raw: {} }],
      [],
    );
    expect(result.rows[0].titleLength).toBe(11);
    expect(result.rows[0].wordCount).toBe(2);
  });

  it("normalizes score between 0 and 1", () => {
    const result = processRecords(
      [
        { title: "Low", score: 0, category: "news", raw: {} },
        { title: "High", score: 100, category: "news", raw: {} },
      ],
      [],
    );
    expect(result.rows[0].score_normalized).toBe(0);
    expect(result.rows[1].score_normalized).toBe(1);
  });

  it("filters CSV columns to requested features only", () => {
    const result = processRecords(
      [{ title: "Test", score: 5, category: "tech", raw: {} }],
      ["title", "category"],
    );
    expect(result.featureNames).toEqual(["title", "category"]);
    expect(result.csv.split("\n")[0]).toBe("title,category");
  });
});

describe("[unit] field encryption", () => {
  it("round-trips a plaintext value", () => {
    const envelope = encryptField("+1-555-0100");
    expect(envelope).not.toBe("+1-555-0100");
    expect(decryptField(envelope)).toBe("+1-555-0100");
  });

  it("returns null for a malformed envelope", () => {
    expect(decryptField("not-a-valid-envelope")).toBeNull();
  });
});
