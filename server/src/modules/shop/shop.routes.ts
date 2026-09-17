import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

const router = Router();
router.use(authenticate, authorize("SHOP"));

router.get("/profile", async (request, response, next) => {
  try { response.json({ shop: await prisma.shop.findUnique({ where: { ownerId: request.user!.id }, include: { items: true } }) }); } catch (error) { next(error); }
});

router.patch("/profile", async (request, response, next) => {
  try { const input = z.object({ open: z.boolean().optional(), operatingHours: z.string().min(3).optional(), name: z.string().min(2).optional() }).parse(request.body); response.json({ shop: await prisma.shop.update({ where: { ownerId: request.user!.id }, data: input }) }); } catch (error) { next(error); }
});

router.get("/items", async (request, response, next) => {
  try { const shop = await prisma.shop.findUnique({ where: { ownerId: request.user!.id } }); response.json({ items: shop ? await prisma.shopItem.findMany({ where: { shopId: shop.id } }) : [] }); } catch (error) { next(error); }
});

router.post("/items", async (request, response, next) => {
  try { const input = z.object({ name: z.string().min(2), price: z.number().int().positive() }).parse(request.body); const shop = await prisma.shop.findUniqueOrThrow({ where: { ownerId: request.user!.id } }); response.status(201).json({ item: await prisma.shopItem.create({ data: { shopId: shop.id, ...input } }) }); } catch (error) { next(error); }
});

router.get("/orders", async (request, response, next) => {
  try { const shop = await prisma.shop.findUnique({ where: { ownerId: request.user!.id } }); response.json({ orders: shop ? await prisma.order.findMany({ where: { shopId: shop.id }, include: { customer: true, items: true }, orderBy: { createdAt: "desc" } }) : [] }); } catch (error) { next(error); }
});

router.patch("/orders/:orderId/status", async (request, response, next) => {
  try { const input = z.object({ status: z.enum(["PREPARING", "READY_FOR_PICKUP", "COMPLETED"]) }).parse(request.body); const order = await prisma.order.updateMany({ where: { id: request.params.orderId, shop: { ownerId: request.user!.id } }, data: { shopStatus: input.status } }); if (!order.count) { response.status(404).json({ error: "NOT_FOUND", message: "Shop order not found." }); return; } response.json({ success: true }); } catch (error) { next(error); }
});

router.get("/sales", async (request, response, next) => {
  try { const shop = await prisma.shop.findUnique({ where: { ownerId: request.user!.id } }); const orders = shop ? await prisma.order.findMany({ where: { shopId: shop.id, status: "DELIVERED" }, select: { total: true, createdAt: true } }) : []; response.json({ orders, total: orders.reduce((sum, order) => sum + order.total, 0) }); } catch (error) { next(error); }
});

export { router as shopRouter };
