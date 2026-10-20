import { PrismaClient, Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

const prisma = new PrismaClient();

describe("UniServe database seed", () => {
  it("creates pending jobs without assignments and preserves saved state when reseeded", async () => {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: "seed-order-1001" }, include: { delivery: true } });
    expect(order.status).toBe("PENDING");
    expect(order.riderId).toBeNull();
    expect(order.delivery).toBeNull();
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    execFileSync(process.execPath, ["--import", "tsx", "prisma/seed.ts"], { env: process.env, stdio: "pipe" });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELLED");
  });
  it("creates one account for each application role", async () => {
    const users = await prisma.user.findMany({
      where: { email: { endsWith: "@uniserve.local" } },
      select: { role: true }
    });

    expect(new Set(users.map((user) => user.role))).toEqual(new Set(Object.values(Role)));
  });
});
