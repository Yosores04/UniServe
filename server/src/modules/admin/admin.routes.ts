import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

router.get("/users", async (_request, response, next) => { try { response.json({ users: await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, active: true, createdAt: true }, orderBy: { createdAt: "desc" } }) }); } catch (error) { next(error); } });
router.get("/riders", async (_request, response, next) => { try { response.json({ riders: await prisma.riderProfile.findMany({ include: { user: true } }) }); } catch (error) { next(error); } });
router.get("/shops", async (_request, response, next) => { try { response.json({ shops: await prisma.shop.findMany({ include: { owner: true, items: true } }) }); } catch (error) { next(error); } });
router.get("/orders", async (_request, response, next) => { try { response.json({ orders: await prisma.order.findMany({ include: { customer: true, shop: true, delivery: true }, orderBy: { createdAt: "desc" } }) }); } catch (error) { next(error); } });
router.get("/complaints", async (_request, response, next) => { try { response.json({ complaints: await prisma.complaint.findMany({ include: { order: true, user: true }, orderBy: { createdAt: "desc" } }) }); } catch (error) { next(error); } });
router.patch("/complaints/:complaintId", async (request, response, next) => { try { const input = z.object({ status: z.enum(["OPEN", "RESOLVED"]), resolution: z.string().optional() }).parse(request.body); response.json({ complaint: await prisma.complaint.update({ where: { id: request.params.complaintId }, data: input }) }); } catch (error) { next(error); } });
router.patch("/shops/:shopId/verification", async (request, response, next) => { try { const input = z.object({ verification: z.enum(["PENDING", "VERIFIED", "REJECTED"]) }).parse(request.body); response.json({ shop: await prisma.shop.update({ where: { id: request.params.shopId }, data: input }) }); } catch (error) { next(error); } });
router.patch("/users/:userId/status", async (request, response, next) => { try { const input = z.object({ active: z.boolean() }).parse(request.body); response.json({ user: await prisma.user.update({ where: { id: request.params.userId }, data: input, select: { id: true, active: true } }) }); } catch (error) { next(error); } });
router.get("/reports/overview", async (_request, response, next) => { try { const [orders, users, shops, complaints] = await Promise.all([prisma.order.findMany({ select: { serviceType: true, total: true, status: true } }), prisma.user.count(), prisma.shop.count(), prisma.complaint.count({ where: { status: "OPEN" } })]); const serviceCounts = orders.reduce<Record<string, number>>((counts, order) => ({ ...counts, [order.serviceType]: (counts[order.serviceType] ?? 0) + 1 }), {}); response.json({ totals: { orders: orders.length, users, shops, openComplaints: complaints, revenue: orders.reduce((sum, order) => sum + order.total, 0) }, services: Object.entries(serviceCounts).map(([serviceType, count]) => ({ serviceType, count })) }); } catch (error) { next(error); } });

export { router as adminRouter };
