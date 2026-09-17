import bcrypt from "bcryptjs";
import { PrismaClient, Role, RiderAvailability, ShopVerification, OrderStatus, ShopOrderStatus, PaymentMethod, ComplaintStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function password(value: string) {
  return bcrypt.hash(value, 12);
}

async function main() {
  const adminPassword = await password("Admin123!");
  const customerPassword = await password("Customer123!");
  const riderPassword = await password("Rider123!");
  const shopPassword = await password("Shop123!");

  const admin = await prisma.user.upsert({
    where: { email: "admin@uniserve.local" },
    update: { name: "UniServe Administrator", role: Role.ADMIN, active: true, passwordHash: adminPassword },
    create: { name: "UniServe Administrator", email: "admin@uniserve.local", role: Role.ADMIN, passwordHash: adminPassword }
  });
  const customer = await prisma.user.upsert({
    where: { email: "customer@uniserve.local" },
    update: { name: "Jessa M.", role: Role.CUSTOMER, active: true, passwordHash: customerPassword },
    create: { name: "Jessa M.", email: "customer@uniserve.local", role: Role.CUSTOMER, passwordHash: customerPassword, customerProfile: { create: { campusId: "student-001" } } }
  });
  await prisma.customerProfile.upsert({ where: { userId: customer.id }, update: {}, create: { userId: customer.id, campusId: "student-001" } });

  const rider = await prisma.user.upsert({
    where: { email: "rider@uniserve.local" },
    update: { name: "Mara D.", role: Role.RIDER, active: true, passwordHash: riderPassword },
    create: { name: "Mara D.", email: "rider@uniserve.local", role: Role.RIDER, passwordHash: riderPassword, riderProfile: { create: { verified: true, availability: RiderAvailability.ONLINE, currentPoint: "Student Center", earningsToday: 420, deliveriesToday: 8 } } }
  });
  const riderProfile = await prisma.riderProfile.upsert({ where: { userId: rider.id }, update: { verified: true, availability: RiderAvailability.ONLINE }, create: { userId: rider.id, verified: true, availability: RiderAvailability.ONLINE, currentPoint: "Student Center" } });

  const shopOwner = await prisma.user.upsert({
    where: { email: "shop@uniserve.local" },
    update: { name: "Canteen Manager", role: Role.SHOP, active: true, passwordHash: shopPassword },
    create: { name: "Canteen Manager", email: "shop@uniserve.local", role: Role.SHOP, passwordHash: shopPassword }
  });
  const shop = await prisma.shop.upsert({
    where: { ownerId: shopOwner.id },
    update: { name: "Canteen Express", verification: ShopVerification.VERIFIED, open: true },
    create: { ownerId: shopOwner.id, name: "Canteen Express", category: "Meals and snacks", location: "Main Canteen", operatingHours: "7:00 AM - 6:00 PM", verification: ShopVerification.VERIFIED, salesToday: 6840, rating: 4.8 }
  });
  const chicken = await prisma.shopItem.upsert({ where: { id: "seed-chicken-pastel" }, update: { name: "Chicken pastel", price: 100, shopId: shop.id, available: true }, create: { id: "seed-chicken-pastel", shopId: shop.id, name: "Chicken pastel", price: 100 } });
  const coffee = await prisma.shopItem.upsert({ where: { id: "seed-iced-coffee" }, update: { name: "Iced coffee", price: 30, shopId: shop.id, available: true }, create: { id: "seed-iced-coffee", shopId: shop.id, name: "Iced coffee", price: 30 } });

  const order = await prisma.order.upsert({
    where: { id: "seed-order-1001" },
    update: { customerId: customer.id, shopId: shop.id, status: OrderStatus.PENDING, shopStatus: ShopOrderStatus.READY_FOR_PICKUP, paymentMethod: PaymentMethod.COD, total: 155 },
    create: { id: "seed-order-1001", customerId: customer.id, shopId: shop.id, serviceType: "Food", pickupPoint: "Main Canteen", dropoffPoint: "College of Technologies", status: OrderStatus.PENDING, shopStatus: ShopOrderStatus.READY_FOR_PICKUP, paymentMethod: PaymentMethod.COD, subtotal: 130, deliveryFee: 25, total: 155, customerNote: "Meet near the COT lobby.", items: { create: [{ shopItemId: chicken.id, name: chicken.name, unitPrice: chicken.price }, { shopItemId: coffee.id, name: coffee.name, unitPrice: coffee.price }] } }
  });
  await prisma.chatThread.upsert({ where: { orderId: order.id }, update: {}, create: { orderId: order.id, messages: { create: { senderId: rider.id, content: "I am heading to your drop-off point now." } } } });

  await prisma.complaint.upsert({ where: { id: "seed-complaint-1" }, update: { status: ComplaintStatus.OPEN }, create: { id: "seed-complaint-1", orderId: order.id, userId: customer.id, subject: "Late delivery", detail: "Order arrived after the estimated time." } });
  await prisma.delivery.upsert({ where: { orderId: order.id }, update: { riderId: riderProfile.id }, create: { orderId: order.id, riderId: riderProfile.id } });

  console.log("UniServe seed completed.");
  console.log("Accounts: admin@uniserve.local / Admin123!, customer@uniserve.local / Customer123!, rider@uniserve.local / Rider123!, shop@uniserve.local / Shop123!");
  void admin;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
