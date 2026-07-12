import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("[e2e] public profile directory flow", () => {
  it("serves the public profile directory as an array", async () => {
    const res = await request(app).get("/api/profile/directory");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns 404 for a public profile that does not exist", async () => {
    const res = await request(app).get("/api/profile/999999");
    expect(res.status).toBe(404);
  });
});

describe("[e2e] knowledge graph is protected and reachable", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/knowledge-graph");
    expect(res.status).toBe(401);
  });
});
