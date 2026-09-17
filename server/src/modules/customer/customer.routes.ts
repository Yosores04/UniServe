import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

const router = Router();
router.use(authenticate, authorize("CUSTOMER"));

router.get("/shops", async (_request, response, next) => {
  try { response.json({ shops: await prisma.shop.findMany({ where: { verification: "VERIFIED" }, include: { items: true } }) }); } catch (error) { next(error); }
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
    const input = z.object({ shopId: z.string(), serviceType: z.string(), pickupPoint: z.string().min(1), dropoffPoint: z.string().min(1), customerNote: z.string().optional(), paymentMethod: z.enum(["COD", "EWALLET"]), items: z.array(z.object({ shopItemId: z.string(), quantity: z.number().int().positive() })).min(1) }).parse(request.body);
    if (input.pickupPoint === input.dropoffPoint) { response.status(400).json({ error: "INVALID_ROUTE", message: "Pickup and drop-off locations must be different." }); return; }
    const shop = await prisma.shop.findFirst({ where: { id: input.shopId, verification: "VERIFIED", open: true }, include: { items: true } });
    if (!shop) { response.status(404).json({ error: "SHOP_UNAVAILABLE", message: "This shop is not available." }); return; }
    const selected = input.items.map((item) => ({ ...item, shopItem: shop.items.find((candidate) => candidate.id === item.shopItemId) }));
    if (selected.some((item) => !item.shopItem || !item.shopItem.available)) { response.status(400).json({ error: "INVALID_ITEMS", message: "One or more selected items are unavailable." }); return; }
    const subtotal = selected.reduce((sum, item) => sum + item.shopItem!.price * item.quantity, 0);
    const deliveryFee = input.serviceType === "Errand" ? 35 : 25;
    const order = await prisma.order.create({ data: { customerId: request.user!.id, shopId: shop.id, serviceType: input.serviceType, pickupPoint: input.pickupPoint, dropoffPoint: input.dropoffPoint, paymentMethod: input.paymentMethod, subtotal, deliveryFee, total: subtotal + deliveryFee, customerNote: input.customerNote, items: { create: selected.map((item) => ({ shopItemId: item.shopItemId, name: item.shopItem!.name, quantity: item.quantity, unitPrice: item.shopItem!.price })) }, chatThread: { create: {} } }, include: { items: true, shop: true } });
    response.status(201).json({ order });
  } catch (error) { next(error); }
});

router.post("/orders/:orderId/rating", async (request, response, next) => {
  try {
    const input = z.object({ score: z.number().int().min(1).max(5), comment: z.string().optional() }).parse(request.body);
    const order = await prisma.order.findFirst({ where: { id: request.params.orderId, customerId: request.user!.id, status: "DELIVERED" } });
    if (!order) { response.status(400).json({ error: "RATING_NOT_ALLOWED", message: "Only completed orders can be rated." }); return; }
    const rating = await prisma.rating.upsert({ where: { orderId: order.id }, update: input, create: { orderId: order.id, userId: request.user!.id, ...input } });
    response.status(201).json({ rating });
  } catch (error) { next(error); }
});

router.post("/orders/:orderId/messages", async (request, response, next) => {
  try {
    const input = z.object({ content: z.string().min(1).max(500) }).parse(request.body);
    const thread = await prisma.chatThread.findFirst({ where: { orderId: request.params.orderId, order: { customerId: request.user!.id } } });
    if (!thread) { response.status(404).json({ error: "NOT_FOUND", message: "Order chat not found." }); return; }
    response.status(201).json({ message: await prisma.chatMessage.create({ data: { threadId: thread.id, senderId: request.user!.id, content: input.content } }) });
  } catch (error) { next(error); }
});

export { router as customerRouter };
