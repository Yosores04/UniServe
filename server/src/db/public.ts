import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export const publicUserSelect = { id: true, name: true, email: true, role: true, active: true, createdAt: true } satisfies Prisma.UserSelect;
export const orderInclude = {
  customer: { select: publicUserSelect }, shop: { include: { items: true } }, items: true, rating: true,
  delivery: true, chatThread: { include: { messages: { include: { sender: { select: publicUserSelect } }, orderBy: { createdAt: "asc" as const } } } }
} satisfies Prisma.OrderInclude;

export function todayStart() { const date = new Date(); date.setHours(0, 0, 0, 0); return date; }

export async function riderMetrics<T extends { id: string; earningsToday: number; deliveriesToday: number }>(rider: T): Promise<T> {
  const deliveries = await prisma.delivery.findMany({ where: { riderId: rider.id, deliveredAt: { gte: todayStart() }, order: { status: "DELIVERED" } }, select: { order: { select: { deliveryFee: true } } } });
  return { ...rider, earningsToday: deliveries.reduce((sum, delivery) => sum + delivery.order.deliveryFee, 0), deliveriesToday: deliveries.length };
}

export async function shopMetrics<T extends { id: string; salesToday: number; rating: number }>(shop: T): Promise<T> {
  const [sales, ratings] = await Promise.all([
    prisma.order.aggregate({ where: { shopId: shop.id, status: "DELIVERED", delivery: { deliveredAt: { gte: todayStart() } } }, _sum: { subtotal: true } }),
    prisma.rating.aggregate({ where: { order: { shopId: shop.id, status: "DELIVERED" } }, _avg: { score: true } })
  ]);
  return { ...shop, salesToday: sales._sum.subtotal ?? 0, rating: ratings._avg.score ?? 0 };
}
