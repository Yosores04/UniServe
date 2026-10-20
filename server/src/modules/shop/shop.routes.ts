import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { orderInclude, shopMetrics } from "../../db/public.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

const router = Router();
router.use(authenticate, authorize("SHOP"));
const text = z.string().trim().min(2).max(200);
const profile = z.object({ name: text, category: text, location: text, operatingHours: text });
const item = z.object({ name: text, price: z.number().int().min(1).max(1000000), available: z.boolean().optional() });
router.get("/profile", async (req, res) => { const shop = await prisma.shop.findUnique({ where: { ownerId: req.user!.id }, include: { items: true } }); res.json({ shop: shop ? await shopMetrics(shop) : null }); });
router.post("/profile", async (req, res) => { const input = profile.parse(req.body); res.status(201).json({ shop: await prisma.shop.create({ data: { ...input, ownerId: req.user!.id }, include: { items: true } }) }); });
router.patch("/profile", async (req, res) => { const input = profile.partial().extend({ open: z.boolean().optional() }).parse(req.body); res.json({ shop: await prisma.shop.update({ where: { ownerId: req.user!.id }, data: input, include: { items: true } }) }); });
router.get("/items", async (req, res) => { res.json({ items: await prisma.shopItem.findMany({ where: { shop: { ownerId: req.user!.id } } }) }); });
router.post("/items", async (req, res) => {
  const input = item.parse(req.body);
  const shop = await prisma.shop.findUnique({ where: { ownerId: req.user!.id } });
  if (!shop) { res.status(404).json({ error: "NOT_FOUND", message: "Create your shop first." }); return; }
  res.status(201).json({ item: await prisma.shopItem.create({ data: { ...input, shopId: shop.id } }) });
});
router.patch("/items/:itemId", async (req, res) => {
  const input = item.partial().parse(req.body);
  const updated = await prisma.shopItem.updateMany({ where: { id: req.params.itemId, shop: { ownerId: req.user!.id } }, data: input });
  if (!updated.count) { res.status(404).json({ error: "NOT_FOUND", message: "Shop item not found." }); return; }
  res.json({ item: await prisma.shopItem.findUnique({ where: { id: req.params.itemId } }) });
});
router.get("/orders", async (req, res) => { res.json({ orders: await prisma.order.findMany({ where: { shop: { ownerId: req.user!.id } }, include: orderInclude, orderBy: { createdAt: "desc" } }) }); });
router.patch("/orders/:orderId/status", async (req, res) => {
  const { status } = z.object({ status: z.enum(["PREPARING", "READY_FOR_PICKUP", "COMPLETED"]) }).parse(req.body);
  const previous = { PREPARING: "NEW", READY_FOR_PICKUP: "PREPARING", COMPLETED: "READY_FOR_PICKUP" } as const;
  const result = await prisma.order.updateMany({ where: { id: req.params.orderId, shop: { ownerId: req.user!.id }, shopStatus: previous[status], status: status === "COMPLETED" ? "DELIVERED" : { notIn: ["CANCELLED", "DELIVERED"] } }, data: { shopStatus: status } });
  if (!result.count) { res.status(409).json({ error: "INVALID_TRANSITION", message: "This preparation step is not available." }); return; }
  res.json({ order: await prisma.order.findUnique({ where: { id: req.params.orderId }, include: orderInclude }) });
});
router.get("/sales", async (req, res) => {
  const orders = await prisma.order.findMany({ where: { shop: { ownerId: req.user!.id }, status: "DELIVERED" }, select: { subtotal: true, createdAt: true } });
  res.json({ orders, total: orders.reduce((sum, order) => sum + order.subtotal, 0) });
});
export { router as shopRouter };
