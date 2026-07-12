import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("[regression] healthz endpoint stays stable", () => {
  it("always returns status ok with 200", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("[regression] protected routes stay protected", () => {
  it("rejects unauthenticated access to /users/me with 401", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated access to /agent/sources with 401", async () => {
    const res = await request(app).get("/api/agent/sources");
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated access to /profile/me with 401", async () => {
    const res = await request(app).get("/api/profile/me");
    expect(res.status).toBe(401);
  });
});
