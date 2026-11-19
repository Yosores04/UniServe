import { mkdtemp, unlink, rmdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("UniServe API", () => {
  it("reports service health", async () => {
    const response = await request(createApp()).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "uniserve-api" });
  });
});

describe("hosted web client", () => {
  let webRoot: string;
  const shell = "<html><body>Courier workspace</body></html>";
  beforeAll(async () => {
    webRoot = await mkdtemp(join(tmpdir(), "courier-web-"));
    await writeFile(join(webRoot, "index.html"), shell);
    await writeFile(join(webRoot, "app.js"), "export {}");
  });
  afterAll(async () => {
    await unlink(join(webRoot, "index.html"));
    await unlink(join(webRoot, "app.js"));
    await rmdir(webRoot);
  });

  it.each(["/", "/admin", "/customer", "/rider", "/shop"])("serves the client at %s", async (path) => {
    await request(createApp(webRoot)).get(path).expect(200, shell);
  });

  it("serves built assets and returns 404 for missing assets and API routes", async () => {
    const app = createApp(webRoot);
    await request(app).get("/app.js").expect(200, "export {}");
    await request(app).get("/assets/missing.js").expect(404);
    await request(app).get("/api/missing").expect("Content-Type", /json/).expect(404);
  });

  it("requires an admin session to read admin data on the web origin", async () => {
    const agent = request.agent(createApp(webRoot));
    await agent.get("/api/admin/users").expect(401);
    await agent.post("/api/auth/login").send({ email: "customer@uniserve.local", password: "Customer123!" }).expect(200);
    await agent.get("/api/admin/users").expect(403);
    await agent.post("/api/auth/login").send({ email: "admin@uniserve.local", password: "Admin123!" }).expect(200);
    await agent.get("/api/admin/users").expect(200).expect("Content-Type", /json/);
  });
});
