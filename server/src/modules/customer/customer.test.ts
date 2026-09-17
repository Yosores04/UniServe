import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";

describe("Customer API authorization", () => {
  it("allows a customer to list verified shops", async () => {
    const agent = request.agent(createApp());
    await agent.post("/api/auth/login").send({ email: "customer@uniserve.local", password: "Customer123!" });
    const response = await agent.get("/api/customer/shops");

    expect(response.status).toBe(200);
    expect(response.body.shops.length).toBeGreaterThan(0);
  });

  it("rejects a rider from customer routes", async () => {
    const agent = request.agent(createApp());
    await agent.post("/api/auth/login").send({ email: "rider@uniserve.local", password: "Rider123!" });
    const response = await agent.get("/api/customer/orders");

    expect(response.status).toBe(403);
  });
});
