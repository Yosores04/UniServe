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

  it("includes student entrepreneur shops, products, onboarding and a marketplace request", async () => {
    const seller = await prisma.user.findUniqueOrThrow({ where: { email: "entrepreneur@uniserve.local" }, include: { ownedShop: { include: { items: true } } } });
    expect(seller).toMatchObject({ name: "Alyssa Reyes", role: "SHOP" });
    expect(seller.ownedShop).toMatchObject({ name: "Student Finds", verification: "VERIFIED" });
    expect(seller.ownedShop!.items.map(item => item.name)).toEqual(expect.arrayContaining(["Handmade notebook", "Campus sticker pack", "Crochet keychain"]));
    const applicant = await prisma.user.findUniqueOrThrow({ where: { email: "student.seller@uniserve.local" }, include: { ownedShop: true } });
    expect(applicant).toMatchObject({ name: "Miguel Santos", role: "SHOP", ownedShop: { name: "Study Break Bakes", verification: "PENDING" } });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: "seed-student-marketplace-order" }, include: { items: true, delivery: true, chatThread: true } });
    expect(order).toMatchObject({ shopId: seller.ownedShop!.id, serviceType: "Marketplace", status: "PENDING", shopStatus: "NEW", riderId: null, delivery: null, subtotal: 125, deliveryFee: 25, total: 150 });
    expect(order.chatThread).not.toBeNull();
    expect(order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)).toBe(order.subtotal);
  });

  it("preserves personalized seller details, prices, approvals and marketplace progress on reseed", async () => {
    const seller = await prisma.user.findUniqueOrThrow({ where: { email: "entrepreneur@uniserve.local" } });
    await prisma.user.update({ where: { id: seller.id }, data: { name: "My edited seller name" } });
    await prisma.shop.update({ where: { ownerId: seller.id }, data: { name: "My student business", open: false } });
    await prisma.shopItem.update({ where: { id: "seed-student-keychain" }, data: { price: 55, available: false } });
    await prisma.shop.update({ where: { ownerId: (await prisma.user.findUniqueOrThrow({ where: { email: "student.seller@uniserve.local" } })).id }, data: { verification: "VERIFIED" } });
    await prisma.order.update({ where: { id: "seed-student-marketplace-order" }, data: { status: "CANCELLED" } });
    execFileSync(process.execPath, ["--import", "tsx", "prisma/seed.ts"], { env: process.env, stdio: "pipe" });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: seller.id } })).toMatchObject({ name: "My edited seller name", passwordHash: seller.passwordHash });
    expect(await prisma.shop.findUniqueOrThrow({ where: { ownerId: seller.id } })).toMatchObject({ name: "My student business", open: false });
    expect(await prisma.shopItem.findUniqueOrThrow({ where: { id: "seed-student-keychain" } })).toMatchObject({ price: 55, available: false });
    expect((await prisma.user.findUniqueOrThrow({ where: { email: "student.seller@uniserve.local" }, include: { ownedShop: true } })).ownedShop!.verification).toBe("VERIFIED");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: "seed-student-marketplace-order" } })).status).toBe("CANCELLED");
    expect(await prisma.order.count({ where: { id: "seed-student-marketplace-order" } })).toBe(1);
  });
});
