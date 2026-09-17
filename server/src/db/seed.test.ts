import { PrismaClient, Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

const prisma = new PrismaClient();

describe("UniServe database seed", () => {
  it("creates one account for each application role", async () => {
    const users = await prisma.user.findMany({
      where: { email: { endsWith: "@uniserve.local" } },
      select: { role: true }
    });

    expect(new Set(users.map((user) => user.role))).toEqual(new Set(Object.values(Role)));
  });
});