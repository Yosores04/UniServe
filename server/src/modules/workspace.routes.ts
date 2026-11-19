import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { orderInclude, publicUserSelect, todayStart, riderMetrics, shopMetrics } from "../db/public.js";
import { authenticate } from "../middleware/authenticate.js";

export const workspaceRouter = Router();
workspaceRouter.get("/workspace", authenticate, async (request, response, next) => {
  try {
    const user = request.user!;
    const admin = user.role === "ADMIN";
    let rider = user.role === "RIDER" ? await prisma.riderProfile.findUnique({ where: { userId: user.id }, include: { user: { select: publicUserSelect } } }) : null;
    const where: Prisma.OrderWhereInput = admin ? {} : user.role === "CUSTOMER" ? { customerId: user.id } : user.role === "SHOP" ? { shop: { ownerId: user.id } } : { OR: [{ status: "PENDING", riderId: null }, ...(rider ? [{ riderId: rider.id }] : [])] };
    const orders = await prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: "desc" } });
    const visibleOrders = orders.map(order => {
      if (user.role !== "RIDER" || order.riderId === rider?.id) return order;
      const { customer, chatThread, customerId, customerNote, dropoffLatitude, dropoffLongitude, ...job } = order;
      return job;
    });
    const shops = await prisma.shop.findMany({ where: admin ? {} : user.role === "SHOP" ? { ownerId: user.id } : { verification: "VERIFIED", owner: { active: true } }, include: { items: true, ...(admin ? { owner: { select: publicUserSelect } } : {}) } });
    const scopedShops = await Promise.all(shops.map(shopMetrics));
    if (rider) {
      const completed = orders.filter(order => order.riderId === rider!.id && order.status === "DELIVERED" && order.delivery?.deliveredAt && order.delivery.deliveredAt >= todayStart());
      rider = { ...rider, earningsToday: completed.reduce((sum, order) => sum + order.deliveryFee, 0), deliveriesToday: completed.length };
    }
    const [riders, users, complaints] = await Promise.all([
      admin ? prisma.riderProfile.findMany({ include: { user: { select: publicUserSelect } } }) : [],
      admin ? prisma.user.findMany({ select: publicUserSelect }) : [],
      prisma.complaint.findMany({ where: admin ? {} : { userId: user.id }, include: { user: { select: publicUserSelect } }, orderBy: { createdAt: "desc" } })
    ]);
    let account;
    if (user.role === "CUSTOMER") {
      const [contact, ownedShop] = await Promise.all([
        prisma.customerProfile.findUnique({ where: { userId: user.id }, select: { phone: true } }),
        prisma.shop.findUnique({ where: { ownerId: user.id }, include: { items: { orderBy: { id: "asc" } } } }),
      ]);
      const sellerOrders = ownedShop ? await prisma.order.findMany({ where: { shopId: ownedShop.id }, include: orderInclude, orderBy: { createdAt: "desc" } }) : [];
      account = { profile: { name: user.name, email: user.email, phone: contact?.phone ?? null }, ownedShop, sellerOrders };
    }
    response.json({ ...account, shops: scopedShops, orders: visibleOrders, rider, riders: await Promise.all(riders.map(riderMetrics)), users, complaints });
  } catch (error) { next(error); }
});
