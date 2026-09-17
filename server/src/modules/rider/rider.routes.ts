import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

const router = Router();
router.use(authenticate, authorize("RIDER"));

router.get("/profile", async (request, response, next) => {
  try { response.json({ profile: await prisma.riderProfile.findUnique({ where: { userId: request.user!.id }, include: { user: true } }) }); } catch (error) { next(error); }
});

router.patch("/availability", async (request, response, next) => {
  try { const input = z.object({ availability: z.enum(["ONLINE", "OFFLINE"]) }).parse(request.body); response.json({ profile: await prisma.riderProfile.update({ where: { userId: request.user!.id }, data: { availability: input.availability } }) }); } catch (error) { next(error); }
});

router.get("/jobs", async (_request, response, next) => {
  try { response.json({ jobs: await prisma.order.findMany({ where: { status: "PENDING", riderId: null }, include: { shop: true, items: true }, orderBy: { createdAt: "asc" } }) }); } catch (error) { next(error); }
});

router.post("/jobs/:orderId/accept", async (request, response, next) => {
  try {
    const rider = await prisma.riderProfile.findUnique({ where: { userId: request.user!.id } });
    if (!rider || rider.availability !== "ONLINE" || !rider.verified) { response.status(400).json({ error: "RIDER_OFFLINE", message: "The rider must be verified and online." }); return; }
    const order = await prisma.order.findFirst({ where: { id: request.params.orderId, status: "PENDING", riderId: null } });
    if (!order) { response.status(409).json({ error: "JOB_UNAVAILABLE", message: "This job is no longer available." }); return; }
    const updated = await prisma.order.update({ where: { id: order.id }, data: { riderId: rider.id, status: "ACCEPTED", delivery: { create: { riderId: rider.id, acceptedAt: new Date() } } }, include: { delivery: true } });
    response.json({ order: updated });
  } catch (error) { next(error); }
});

router.patch("/deliveries/:orderId/status", async (request, response, next) => {
  try {
    const input = z.object({ status: z.enum(["PICKED_UP", "ON_THE_WAY", "DELIVERED"]) }).parse(request.body);
    const delivery = await prisma.delivery.findFirst({ where: { orderId: request.params.orderId, rider: { userId: request.user!.id } } });
    if (!delivery) { response.status(404).json({ error: "NOT_FOUND", message: "Assigned delivery not found." }); return; }
    const timestamps = input.status === "PICKED_UP" ? { pickedUpAt: new Date() } : input.status === "DELIVERED" ? { deliveredAt: new Date() } : {};
    const order = await prisma.order.update({ where: { id: delivery.orderId }, data: { status: input.status, delivery: { update: timestamps } }, include: { delivery: true } });
    response.json({ order });
  } catch (error) { next(error); }
});

router.get("/earnings", async (request, response, next) => {
  try { const rider = await prisma.riderProfile.findUnique({ where: { userId: request.user!.id }, include: { deliveries: { include: { order: true }, orderBy: { deliveredAt: "desc" } } } }); response.json({ earningsToday: rider?.earningsToday ?? 0, deliveries: rider?.deliveries ?? [] }); } catch (error) { next(error); }
});

export { router as riderRouter };
