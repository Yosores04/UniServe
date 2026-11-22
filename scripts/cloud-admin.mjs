import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

async function provision() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const previousEmail = process.env.ADMIN_PREVIOUS_EMAIL?.trim().toLowerCase();
  if (!email && !password && !previousEmail) return;
  if (!z.email().max(254).safeParse(email).success || email.endsWith("@uniserve.local")) {
    throw new Error("Set INITIAL_ADMIN_EMAIL to the pilot administrator's email address.");
  }
  if (!password || password.length < 16 || Buffer.byteLength(password) > 72) {
    throw new Error("Set INITIAL_ADMIN_PASSWORD to at least 16 characters and at most 72 UTF-8 bytes.");
  }
  if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Cloud administrator provisioning requires PostgreSQL.");
  }
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction(async tx => {
      // Serialize competing bootstraps across service instances in this database.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(716034822)`;
      const account = await tx.user.findUnique({ where: { email } });
      if (previousEmail) {
        const previous = await tx.user.findUnique({ where: { email: previousEmail } });
        // After a successful rename, a restart finds the administrator at the new address.
        const admin = previous ?? account;
        if (!admin?.active || admin.role !== "ADMIN" || !(await bcrypt.compare(password, admin.passwordHash))) {
          throw new Error("Admin email change requires the existing administrator and current password.");
        }
        if (account && account.id !== admin.id) throw new Error("The requested email is already registered.");
        if (admin.email !== email) {
          await tx.user.update({ where: { id: admin.id }, data: { email } });
          await tx.session.deleteMany({ where: { userId: admin.id } });
          console.log("Administrator email updated.");
        }
        return;
      }
      if (account?.role === "ADMIN") return;
      if (account || await tx.user.count({ where: { role: "ADMIN" } })) {
        throw new Error("Provisioning stopped because the email is registered or an administrator already exists.");
      }
      await tx.user.create({ data: { email, name: "Pilot Administrator", passwordHash, role: "ADMIN" } });
      console.log("Initial pilot administrator created.");
    });
  } finally {
    await prisma.$disconnect();
  }
}

await provision();
