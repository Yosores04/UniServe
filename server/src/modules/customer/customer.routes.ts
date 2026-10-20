import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { orderInclude, publicUserSelect, shopMetrics } from "../../db/public.js";

const router = Router();
router.use(authenticate, authorize("CUSTOMER"));

router.get("/shops", async (_request, response, next) => {
  try { response.json({ shops: await Promise.all((await prisma.shop.findMany({ where: { verification: "VERIFIED", owner: { active: true } }, include: { items: true } })).map(shopMetrics)) }); } catch (error) { next(error); }
});

router.get("/orders", async (request, response, next) => {
  try { response.json({ orders: await prisma.order.findMany({ where: { customerId: request.user!.id }, include: { shop: true, items: true, delivery: true, rating: true }, orderBy: { createdAt: "desc" } }) }); } catch (error) { next(error); }
});

router.get("/orders/:orderId", async (request, response, next) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: request.params.orderId, customerId: request.user!.id }, include: { shop: true, items: true, delivery: true, rating: true, chatThread: { include: { messages: { orderBy: { createdAt: "asc" } } } } } });
    if (!order) { response.status(404).json({ error: "NOT_FOUND", message: "Order not found." }); return; }
    response.json({ order });
  } catch (error) { next(error); }
});

router.post("/orders", async (request, response, next) => {
  try {
    const input = z.object({ shopId: z.string().min(1).max(100), serviceType: z.enum(["Food", "Printing", "Errand", "Marketplace"]), pickupPoint: z.string().trim().min(1).max(200), dropoffPoint: z.string().trim().min(1).max(200), customerNote: z.string().trim().max(1000).optional(), paymentMethod: z.enum(["COD", "EWALLET"]), items: z.array(z.object({ shopItemId: z.string().min(1).max(100), quantity: z.number().int().min(1).max(100) })).min(1).max(50) }).parse(request.body);
    const shop = await prisma.shop.findFirst({ where: { id: input.shopId, verification: "VERIFIED", owner: { active: true }, open: true }, include: { items: true } });
    if (!shop) { response.status(404).json({ error: "SHOP_UNAVAILABLE", message: "This shop is not available." }); return; }
    if (shop.location.trim() === input.dropoffPoint) { response.status(400).json({ error: "INVALID_ROUTE", message: "Pickup and drop-off locations must be different." }); return; }
    const selected = input.items.map((item) => ({ ...item, shopItem: shop.items.find((candidate) => candidate.id === item.shopItemId) }));
    if (selected.some((item) => !item.shopItem || !item.shopItem.available)) { response.status(400).json({ error: "INVALID_ITEMS", message: "One or more selected items are unavailable." }); return; }
    const subtotal = selected.reduce((sum, item) => sum + item.shopItem!.price * item.quantity, 0);
    const deliveryFee = input.serviceType === "Errand" ? 35 : 25;
    if (!Number.isSafeInteger(subtotal) || subtotal > 100000000) { response.status(400).json({ error: "ORDER_TOO_LARGE", message: "The order value exceeds the supported limit." }); return; }
    const order = await prisma.order.create({ data: { customerId: request.user!.id, shopId: shop.id, serviceType: input.serviceType, pickupPoint: shop.location.trim(), dropoffPoint: input.dropoffPoint, paymentMethod: input.paymentMethod, subtotal, deliveryFee, total: subtotal + deliveryFee, customerNote: input.customerNote, items: { create: selected.map((item) => ({ shopItemId: item.shopItemId, name: item.shopItem!.name, quantity: item.quantity, unitPrice: item.shopItem!.price })) }, chatThread: { create: {} } }, include: { items: true, shop: true } });
    response.status(201).json({ order });
  } catch (error) { next(error); }
});

router.post("/orders/:orderId/rating", async (request, response, next) => {
  try {
    const input = z.object({ score: z.number().int().min(1).max(5), comment: z.string().trim().max(1000).optional() }).parse(request.body);
    const order = await prisma.order.findFirst({ where: { id: request.params.orderId, customerId: request.user!.id, status: "DELIVERED" } });
    if (!order) { response.status(400).json({ error: "RATING_NOT_ALLOWED", message: "Only completed orders can be rated." }); return; }
    const rating = await prisma.$transaction(async tx => {
      const saved = await tx.rating.upsert({ where: { orderId: order.id }, update: input, create: { orderId: order.id, userId: request.user!.id, ...input } });
      const average = await tx.rating.aggregate({ where: { order: { shopId: order.shopId, status: "DELIVERED" } }, _avg: { score: true } });
      await tx.shop.update({ where: { id: order.shopId }, data: { rating: average._avg.score ?? 0 } });
      return saved;
    });
    response.status(201).json({ rating });
  } catch (error) { next(error); }
});

router.post("/orders/:orderId/messages", async (request, response, next) => {
  try {
    const input = z.object({ content: z.string().trim().min(1).max(500) }).parse(request.body);
    const thread = await prisma.chatThread.findFirst({ where: { orderId: request.params.orderId, order: { customerId: request.user!.id } } });
    if (!thread) { response.status(404).json({ error: "NOT_FOUND", message: "Order chat not found." }); return; }
    response.status(201).json({ message: await prisma.chatMessage.create({ data: { threadId: thread.id, senderId: request.user!.id, content: input.content }, include: { sender: { select: publicUserSelect } } }) });
  } catch (error) { next(error); }
});

router.post("/orders/:orderId/cancel", async (request, response, next) => {
  try {
    const result = await prisma.order.updateMany({ where: { id: request.params.orderId, customerId: request.user!.id, status: "PENDING", riderId: null }, data: { status: "CANCELLED" } });
    if (!result.count) { response.status(409).json({ error: "CANCEL_NOT_ALLOWED", message: "Only pending orders can be cancelled." }); return; }
    response.json({ order: await prisma.order.findUnique({ where: { id: request.params.orderId }, include: orderInclude }) });
  } catch (error) { next(error); }
});

router.post("/orders/:orderId/complaint", async (request, response, next) => {
  try {
    const input = z.object({ subject: z.string().trim().min(2).max(120), detail: z.string().trim().min(2).max(2000) }).parse(request.body);
    const order = await prisma.order.findFirst({ where: { id: request.params.orderId, customerId: request.user!.id } });
    if (!order) { response.status(404).json({ error: "NOT_FOUND", message: "Order not found." }); return; }
    response.status(201).json({ complaint: await prisma.complaint.create({ data: { ...input, orderId: order.id, userId: request.user!.id } }) });
  } catch (error) { next(error); }
});

export { router as customerRouter };
