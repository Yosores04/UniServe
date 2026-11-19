import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { orderInclude, shopMetrics } from "../../db/public.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

import { pin, shopPinFields } from "../location.js";

const router = Router();
router.use(authenticate, authorize("SHOP", "CUSTOMER"));
const text = z.string().trim().min(2).max(200);
const profile = z.object({ name: text, category: text, location: text, operatingHours: text, pin: pin.nullish() });
const item = z.object({ name: text, price: z.number().int().min(1).max(1000000), available: z.boolean().optional() });
router.post("/applications", authorize("CUSTOMER"), async (req, res) => {
  const { product, pin: shopPin, ...details } = profile.extend({ product: item.pick({ name: true, price: true }) }).parse(req.body);
  const ownerId = req.user!.id;
  const result = await prisma.$transaction(async (db) => {
    const existing = await db.shop.findUnique({ where: { ownerId }, select: { id: true, verification: true } });
    if (!existing) {
      const shop = await db.shop.create({ data: { ...details, ...shopPinFields(shopPin), ownerId, items: { create: product } }, include: { items: true } });
      return { status: 201, shop };
    }
    if (existing.verification !== "REJECTED") return null;
    const updated = await db.shop.updateMany({ where: { ownerId, verification: "REJECTED" }, data: { ...details, ...shopPinFields(shopPin), verification: "PENDING" } });
    if (!updated.count) return null;
    const first = await db.shopItem.findFirst({ where: { shopId: existing.id }, orderBy: { id: "asc" } });
    if (first) await db.shopItem.update({ where: { id: first.id }, data: product });
    else await db.shopItem.create({ data: { ...product, shopId: existing.id } });
    return { status: 200, shop: await db.shop.findUniqueOrThrow({ where: { ownerId }, include: { items: true } }) };
  });
  if (!result) { res.status(409).json({ message: "Your shop already has an application." }); return; }
  res.status(result.status).json({ shop: result.shop });
});
router.get("/profile", async (req, res) => { const shop = await prisma.shop.findUnique({ where: { ownerId: req.user!.id }, include: { items: true } }); res.json({ shop: shop ? await shopMetrics(shop) : null }); });
router.post("/profile", authorize("SHOP"), async (req, res) => { const { pin: shopPin, ...input } = profile.parse(req.body); res.status(201).json({ shop: await prisma.shop.create({ data: { ...input, ...shopPinFields(shopPin), ownerId: req.user!.id }, include: { items: true } }) }); });
router.patch("/profile", async (req, res) => { const { pin: shopPin, ...input } = profile.partial().extend({ open: z.boolean().optional() }).parse(req.body); res.json({ shop: await prisma.shop.update({ where: { ownerId: req.user!.id }, data: { ...input, ...shopPinFields(shopPin) }, include: { items: true } }) }); });
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
