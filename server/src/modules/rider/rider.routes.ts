import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { orderInclude, publicUserSelect, todayStart, riderMetrics } from "../../db/public.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

import { activeDeliveryStatuses, courierFix } from "../location.js";

const router = Router();
router.use(authenticate, authorize("RIDER"));
router.get("/profile", async (req, res) => { const rider = await prisma.riderProfile.findUnique({ where: { userId: req.user!.id }, include: { user: { select: publicUserSelect } } }); res.json({ profile: rider ? await riderMetrics(rider) : null }); });
router.patch("/availability", async (req, res) => {
  const input = z.object({ availability: z.enum(["ONLINE", "OFFLINE"]) }).parse(req.body);
  res.json({ profile: await prisma.riderProfile.update({ where: { userId: req.user!.id }, data: input }) });
});
router.get("/jobs", async (_req, res) => {
  const jobs = await prisma.order.findMany({ where: { status: "PENDING", riderId: null }, include: { shop: { include: { items: true } }, items: true }, orderBy: { createdAt: "asc" } });
  res.json({ jobs: jobs.map(({ customerId, customerNote, dropoffLatitude, dropoffLongitude, ...job }) => job) });
});
router.post("/jobs/:orderId/accept", async (req, res) => {
  const rider = await prisma.riderProfile.findUnique({ where: { userId: req.user!.id } });
  if (!rider || !rider.verified || rider.availability !== "ONLINE") { res.status(400).json({ error: "RIDER_OFFLINE", message: "The rider must be verified and online." }); return; }
  const order = await prisma.$transaction(async tx => {
    const claimed = await tx.order.updateMany({ where: { id: req.params.orderId, status: "PENDING", riderId: null }, data: { status: "ACCEPTED", riderId: rider.id } });
    if (!claimed.count) return null;
    await tx.delivery.create({ data: { orderId: req.params.orderId, riderId: rider.id, acceptedAt: new Date() } });
    return tx.order.findUnique({ where: { id: req.params.orderId }, include: orderInclude });
  });
  if (!order) { res.status(409).json({ error: "JOB_UNAVAILABLE", message: "This job is no longer available." }); return; }
  res.json({ order });
});
async function updateLocation(req: Request<{ orderId: string }>, res: Response) {
  const fix = req.method === "PATCH" ? courierFix.parse(req.body) : null;
  const orderId = req.params.orderId;
  const result = await prisma.$transaction(async tx => {
    const assignment = await tx.delivery.findFirst({
      where: { orderId, deliveredAt: null, rider: { userId: req.user!.id }, order: { status: { in: activeDeliveryStatuses } } },
      select: { riderId: true, order: { select: { riderId: true } } },
    });
    if (!assignment || assignment.riderId !== assignment.order.riderId) return "unassigned";
    if (!fix) {
      await tx.courierLocation.deleteMany({ where: { orderId } });
      return "saved";
    }
    const previous = await tx.courierLocation.findUnique({ where: { orderId }, select: { recordedAt: true } });
    if (previous && previous.recordedAt >= fix.recordedAt) return "outdated";
    await tx.courierLocation.upsert({ where: { orderId }, create: { orderId, ...fix }, update: fix });
    return "saved";
  });
  if (result === "unassigned") { res.status(404).json({ error: "NOT_FOUND", message: "Active delivery not found." }); return; }
  if (result === "outdated") { res.status(409).json({ error: "OUTDATED_LOCATION", message: "A newer GPS reading has already been received." }); return; }
  res.status(204).end();
}
router.patch("/deliveries/:orderId/location", updateLocation);
router.delete("/deliveries/:orderId/location", updateLocation);

router.patch("/deliveries/:orderId/status", async (req, res) => {
  const { status } = z.object({ status: z.enum(["PICKED_UP", "ON_THE_WAY", "DELIVERED"]) }).parse(req.body);
  const rider = await prisma.riderProfile.findUnique({ where: { userId: req.user!.id } });
  if (!rider) { res.status(404).json({ error: "NOT_FOUND", message: "Rider profile not found." }); return; }
  const previous = { PICKED_UP: "ACCEPTED", ON_THE_WAY: "PICKED_UP", DELIVERED: "ON_THE_WAY" } as const;
  const order = await prisma.$transaction(async tx => {
    const changed = await tx.order.updateMany({ where: { id: req.params.orderId, riderId: rider.id, status: previous[status], ...(status === "PICKED_UP" ? { shopStatus: "READY_FOR_PICKUP" as const } : {}) }, data: { status, ...(status === "DELIVERED" ? { shopStatus: "COMPLETED" as const } : {}) } });
    if (!changed.count) return null;
    await tx.delivery.update({ where: { orderId: req.params.orderId }, data: status === "PICKED_UP" ? { pickedUpAt: new Date() } : status === "DELIVERED" ? { deliveredAt: new Date() } : {} });
    const updated = await tx.order.findUniqueOrThrow({ where: { id: req.params.orderId }, include: orderInclude });
    if (status === "DELIVERED") {
      await tx.courierLocation.deleteMany({ where: { orderId: updated.id } });
      await tx.riderProfile.update({ where: { id: rider.id }, data: { earningsToday: { increment: updated.deliveryFee }, deliveriesToday: { increment: 1 } } });
      await tx.shop.update({ where: { id: updated.shopId }, data: { salesToday: { increment: updated.subtotal } } });
    }
    return updated;
  });
  if (!order) { res.status(409).json({ error: "INVALID_TRANSITION", message: "Complete each delivery step in order; pickup requires a ready shop order." }); return; }
  res.json({ order });
});
router.post("/deliveries/:orderId/messages", async (req, res) => {
  const input = z.object({ content: z.string().trim().min(1).max(500) }).parse(req.body);
  const thread = await prisma.chatThread.findFirst({ where: { orderId: req.params.orderId, order: { delivery: { rider: { userId: req.user!.id } } } } });
  if (!thread) { res.status(404).json({ error: "NOT_FOUND", message: "Assigned delivery chat not found." }); return; }
  res.status(201).json({ message: await prisma.chatMessage.create({ data: { threadId: thread.id, senderId: req.user!.id, content: input.content }, include: { sender: { select: publicUserSelect } } }) });
});
router.get("/earnings", async (req, res) => {
  const deliveries = await prisma.delivery.findMany({ where: { rider: { userId: req.user!.id }, deliveredAt: { gte: todayStart() }, order: { status: "DELIVERED" } }, include: { order: true }, orderBy: { deliveredAt: "desc" } });
  res.json({ earningsToday: deliveries.reduce((sum, delivery) => sum + delivery.order.deliveryFee, 0), deliveries });
});
export { router as riderRouter };
