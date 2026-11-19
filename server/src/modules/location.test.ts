import request from "supertest";
import { expect, it } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../db/prisma.js";

const app = createApp();
async function register(role: "CUSTOMER" | "RIDER") {
  const agent = request.agent(app);
  const result = await agent.post("/api/auth/register").send({ name: "Map Tester", email: `${crypto.randomUUID()}@test.local`, password: "Password123!", role }).expect(201);
  return { agent, userId: result.body.user.id as string };
}

it("validates shop pins, snapshots coordinates at checkout, and hides drop-off pins on job boards", async () => {
  const { agent: seller } = await register("CUSTOMER");
  const { agent: rider } = await register("RIDER");
  const pin = { latitude: 8.15, longitude: 125.12 };
  const input = { name: "Map shop", category: "Food", location: "Shop lobby", operatingHours: "All day", product: { name: "Rice", price: 10 } };
  await seller.post("/api/shop/applications").send({ ...input, pin: { latitude: 91, longitude: 0 } }).expect(400);
  const { body: { shop } } = await seller.post("/api/shop/applications").send({ ...input, pin }).expect(201);
  expect(shop).toMatchObject(pin);
  await prisma.shop.update({ where: { id: shop.id }, data: { verification: "VERIFIED" } });
  expect((await seller.patch("/api/shop/profile").send({ name: "New Map Shop" }).expect(200)).body.shop).toMatchObject(pin);
  const orderInput = { shopId: shop.id, serviceType: "Food", pickupPoint: "Shop lobby", dropoffPoint: "Gym", paymentMethod: "COD", items: [{ shopItemId: shop.items[0].id, quantity: 1 }] };
  await seller.post("/api/customer/orders").send({ ...orderInput, dropoffPin: { latitude: 5, longitude: 181 } }).expect(400);
  const order = (await seller.post("/api/customer/orders").send({ ...orderInput, dropoffPin: { latitude: 8, longitude: 125 }, pickupLatitude: 90 }).expect(201)).body.order;
  expect((await seller.patch("/api/shop/profile").send({ pin: null }).expect(200)).body.shop).toMatchObject({ latitude: null, longitude: null });
  expect((await seller.get(`/api/customer/orders/${order.id}`)).body.order).toMatchObject({ pickupLatitude: pin.latitude, pickupLongitude: pin.longitude, dropoffLatitude: 8, dropoffLongitude: 125 });
  for (const [route, key] of [["/api/workspace", "orders"], ["/api/rider/jobs", "jobs"]]) {
    const job = (await rider.get(route).expect(200)).body[key].find((candidate: { id: string }) => candidate.id === order.id);
    expect(job).toHaveProperty("pickupLatitude", pin.latitude);
    expect(job).not.toHaveProperty("dropoffLatitude");
    expect(job).not.toHaveProperty("dropoffLongitude");
  }
});

it("shares only the latest fresh fix for the assigned rider and purchasing customer until stopped or delivered", async () => {
  const { agent: buyer } = await register("CUSTOMER");
  const { agent: stranger } = await register("CUSTOMER");
  const { agent: rider, userId } = await register("RIDER");
  const { agent: otherRider } = await register("RIDER");
  const shop = (await buyer.get("/api/customer/shops")).body.shops[0];
  const order = (await buyer.post("/api/customer/orders").send({ shopId: shop.id, serviceType: "Food", pickupPoint: shop.location, dropoffPoint: "Gym", paymentMethod: "COD", items: [{ shopItemId: shop.items[0].id, quantity: 1 }] }).expect(201)).body.order;
  const read = `/api/customer/orders/${order.id}/location`;
  const write = `/api/rider/deliveries/${order.id}/location`;
  const fix = { latitude: 8.14123, longitude: 125.1578, recordedAt: new Date().toISOString() };
  expect((await buyer.get(read).expect(200)).body.location).toBeNull();
  await rider.patch(write).send(fix).expect(404);
  await prisma.riderProfile.update({ where: { userId }, data: { verified: true, availability: "ONLINE" } });
  await rider.post(`/api/rider/jobs/${order.id}/accept`).expect(200);
  await otherRider.patch(write).send(fix).expect(404);
  await otherRider.delete(write).expect(404);
  await stranger.get(read).expect(404);
  await rider.get(read).expect(403);
  await request(app).get(read).expect(401);
  for (const invalid of [{ latitude: -91 }, { longitude: "1" }, { recordedAt: "yesterday" }, { recordedAt: new Date(Date.now() - 600000).toISOString() }, { recordedAt: new Date(Date.now() + 600000).toISOString() }]) {
    await rider.patch(write).send({ ...fix, ...invalid }).expect(400);
  }
  await rider.patch(write).send(fix).expect(204);
  await rider.patch(write).send({ ...fix, recordedAt: new Date(Date.parse(fix.recordedAt) - 1000).toISOString() }).expect(409);
  expect((await buyer.get(read).expect(200)).body).toEqual({ location: fix });
  expect((await buyer.get("/api/workspace")).text).not.toContain("8.14123");
  expect((await buyer.get(`/api/customer/orders/${order.id}`)).text).not.toContain("8.14123");
  const threeMinutesAgo = new Date(Date.now() - 180_000);
  await prisma.courierLocation.update({ where: { orderId: order.id }, data: { recordedAt: threeMinutesAgo } });
  expect((await buyer.get(read)).body.location.recordedAt).toBe(threeMinutesAgo.toISOString());
  await prisma.courierLocation.update({ where: { orderId: order.id }, data: { recordedAt: new Date(Date.now() - 660_000) } });
  expect((await buyer.get(read)).body.location).toBeNull();
  await rider.delete(write).expect(204);
  expect((await buyer.get(read)).body.location).toBeNull();
  await rider.patch(write).send({ ...fix, recordedAt: new Date().toISOString() }).expect(204);
  await prisma.order.update({ where: { id: order.id }, data: { status: "ON_THE_WAY" } });
  await rider.patch(`/api/rider/deliveries/${order.id}/status`).send({ status: "DELIVERED" }).expect(200);
  expect((await buyer.get(read)).body.location).toBeNull();
  await rider.patch(write).send(fix).expect(404);
  expect(await prisma.courierLocation.count({ where: { orderId: order.id } })).toBe(0);
});
