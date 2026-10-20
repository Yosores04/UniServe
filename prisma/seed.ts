import "../server/src/config/env.js";
import bcrypt from "bcryptjs";
import { PrismaClient, Role, type ShopVerification } from "@prisma/client";

const prisma = new PrismaClient();
async function account(email: string, name: string, role: Role, password: string) {
  return prisma.user.upsert({ where: { email }, update: {}, create: { email, name, role, passwordHash: await bcrypt.hash(password, 12) } });
}
async function main() {
  await account("admin@uniserve.local", "UniServe Administrator", "ADMIN", "Admin123!");
  const customer = await account("customer@uniserve.local", "Jessa M.", "CUSTOMER", "Customer123!");
  await prisma.customerProfile.upsert({ where: { userId: customer.id }, update: {}, create: { userId: customer.id, campusId: "student-001" } });
  const rider = await account("rider@uniserve.local", "Mara D.", "RIDER", "Rider123!");
  await prisma.riderProfile.upsert({ where: { userId: rider.id }, update: {}, create: { userId: rider.id, verified: true, availability: "ONLINE", currentPoint: "Student Center" } });
  const owner = await account("shop@uniserve.local", "Canteen Manager", "SHOP", "Shop123!");
  const shop = await prisma.shop.upsert({ where: { ownerId: owner.id }, update: {}, create: { ownerId: owner.id, name: "Canteen Express", category: "Meals and snacks", location: "Main Canteen", operatingHours: "7:00 AM - 6:00 PM", verification: "VERIFIED" } });
  const chicken = await prisma.shopItem.upsert({ where: { id: "seed-chicken-pastel" }, update: {}, create: { id: "seed-chicken-pastel", shopId: shop.id, name: "Chicken pastel", price: 100 } });
  const coffee = await prisma.shopItem.upsert({ where: { id: "seed-iced-coffee" }, update: {}, create: { id: "seed-iced-coffee", shopId: shop.id, name: "Iced coffee", price: 30 } });
  await prisma.order.upsert({
    where: { id: "seed-order-1001" }, update: {},
    create: { id: "seed-order-1001", customerId: customer.id, shopId: shop.id, serviceType: "Food", pickupPoint: "Main Canteen", dropoffPoint: "College of Technologies", shopStatus: "READY_FOR_PICKUP", subtotal: 130, deliveryFee: 25, total: 155, customerNote: "Meet near the COT lobby.", items: { create: [{ shopItemId: chicken.id, name: chicken.name, unitPrice: chicken.price }, { shopItemId: coffee.id, name: coffee.name, unitPrice: coffee.price }] } }
  });
  await prisma.chatThread.upsert({ where: { orderId: "seed-order-1001" }, update: {}, create: { orderId: "seed-order-1001" } });
  // Repair only the legacy unclaimed seed assignment; never reset a live order.
  await prisma.delivery.deleteMany({ where: { orderId: "seed-order-1001", acceptedAt: null, pickedUpAt: null, deliveredAt: null, order: { status: "PENDING", riderId: null } } });
  await prisma.complaint.upsert({ where: { id: "seed-complaint-1" }, update: {}, create: { id: "seed-complaint-1", orderId: "seed-order-1001", userId: customer.id, subject: "Demo support request", detail: "Please confirm where to collect the order." } });
  const catalogs: { email: string; ownerName: string; name: string; category: string; location: string; operatingHours: string; verification: ShopVerification; items: { id: string; name: string; price: number }[] }[] = [
    { email: "printing@uniserve.local", ownerName: "Campus Print Manager", name: "Campus Print Hub", category: "Printing", location: "Library Annex", operatingHours: "8:00 AM - 5:00 PM", verification: "VERIFIED", items: [{ id: "seed-document-print", name: "Document printing (per page)", price: 5 }, { id: "seed-print-errand", name: "Campus document collection", price: 20 }] },
    { email: "entrepreneur@uniserve.local", ownerName: "Alyssa Reyes", name: "Student Finds", category: "Student entrepreneur · Crafts and stationery", location: "Student Center", operatingHours: "9:00 AM - 4:00 PM", verification: "VERIFIED", items: [{ id: "seed-student-notebook", name: "Handmade notebook", price: 75 }, { id: "seed-student-stickers", name: "Campus sticker pack", price: 25 }, { id: "seed-student-keychain", name: "Crochet keychain", price: 45 }] },
    { email: "student.seller@uniserve.local", ownerName: "Miguel Santos", name: "Study Break Bakes", category: "Student entrepreneur · Baked treats", location: "Business Building", operatingHours: "10:00 AM - 3:00 PM", verification: "PENDING", items: [{ id: "seed-student-brownies", name: "Chocolate brownie", price: 35 }, { id: "seed-student-cookies", name: "Cookie duo", price: 40 }] }
  ];
  for (const catalog of catalogs) {
    const user = await account(catalog.email, catalog.ownerName, "SHOP", "Shop123!");
    const store = await prisma.shop.upsert({ where: { ownerId: user.id }, update: {}, create: { ownerId: user.id, name: catalog.name, category: catalog.category, location: catalog.location, operatingHours: catalog.operatingHours, verification: catalog.verification } });
    for (const item of catalog.items) await prisma.shopItem.upsert({ where: { id: item.id }, update: {}, create: { ...item, shopId: store.id } });
  }
  // Upgrade only the old generic demo labels; retain personalized accounts,
  // prices, product availability, and any completed verification decisions.
  await prisma.user.updateMany({ where: { email: "entrepreneur@uniserve.local", role: "SHOP", name: "Student Entrepreneur" }, data: { name: "Alyssa Reyes" } });
  await prisma.shop.updateMany({ where: { owner: { email: "entrepreneur@uniserve.local" }, name: "Student Finds", category: "Marketplace" }, data: { category: "Student entrepreneur · Crafts and stationery" } });

  const studentShop = await prisma.shop.findUniqueOrThrow({ where: { ownerId: (await prisma.user.findUniqueOrThrow({ where: { email: "entrepreneur@uniserve.local" } })).id } });
  const notebook = await prisma.shopItem.findUniqueOrThrow({ where: { id: "seed-student-notebook" } });
  const stickers = await prisma.shopItem.findUniqueOrThrow({ where: { id: "seed-student-stickers" } });
  const marketplaceSubtotal = notebook.price + stickers.price * 2;
  await prisma.order.upsert({
    where: { id: "seed-student-marketplace-order" }, update: {},
    create: { id: "seed-student-marketplace-order", customerId: customer.id, shopId: studentShop.id, serviceType: "Marketplace", pickupPoint: studentShop.location, dropoffPoint: "College of Technologies", subtotal: marketplaceSubtotal, deliveryFee: 25, total: marketplaceSubtotal + 25, customerNote: "One notebook and two sticker packs, please. Meet at the COT lobby.", items: { create: [{ shopItemId: notebook.id, name: notebook.name, quantity: 1, unitPrice: notebook.price }, { shopItemId: stickers.id, name: stickers.name, quantity: 2, unitPrice: stickers.price }] }, chatThread: { create: {} } }
  });
  console.log("UniServe seed completed; existing accounts and saved workflows preserved.");
  console.log("Accounts: admin@uniserve.local / Admin123!, customer@uniserve.local / Customer123!, rider@uniserve.local / Rider123!, shop@uniserve.local / Shop123!, printing@uniserve.local / Shop123!, entrepreneur@uniserve.local / Shop123!, student.seller@uniserve.local / Shop123!");
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
