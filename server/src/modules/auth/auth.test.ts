import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";

describe("UniServe authentication", () => {
  it("logs in a seeded user and exposes the current role", async () => {
    const agent = request.agent(createApp());
    const login = await agent.post("/api/auth/login").send({ email: "customer@uniserve.local", password: "Customer123!" });
    const current = await agent.get("/api/auth/me");

    expect(login.status).toBe(200);
    expect(current.body.user).toMatchObject({ email: "customer@uniserve.local", role: "CUSTOMER" });
  });

  it("rejects an authenticated customer from an admin endpoint", async () => {
    const agent = request.agent(createApp());
    await agent.post("/api/auth/login").send({ email: "customer@uniserve.local", password: "Customer123!" });
    const response = await agent.get("/api/admin/users");

    expect(response.status).toBe(403);
  });
});
