import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";

describe("Rider availability authorization", () => {
  it("allows a rider to switch between online and offline", async () => {
    const agent = request.agent(createApp());
    await agent.post("/api/auth/login").send({ email: "rider@uniserve.local", password: "Rider123!" });
    const offline = await agent.patch("/api/rider/availability").send({ availability: "OFFLINE" });
    const online = await agent.patch("/api/rider/availability").send({ availability: "ONLINE" });

    expect(offline.status).toBe(200);
    expect(offline.body.profile.availability).toBe("OFFLINE");
    expect(online.body.profile.availability).toBe("ONLINE");
  });
});
