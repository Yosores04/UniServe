import type { OrderStatus } from "@prisma/client";
import { z } from "zod";

export const pin = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export function shopPinFields(value: z.infer<typeof pin> | null | undefined) {
  if (value === undefined) return {};
  return value ?? { latitude: null, longitude: null };
}

export const activeDeliveryStatuses: OrderStatus[] = ["ACCEPTED", "PICKED_UP", "ON_THE_WAY"];
export const locationReadLifetimeMs = 10 * 60_000;
export const courierFix = pin.extend({
  recordedAt: z.iso.datetime({ offset: true }).transform(value => new Date(value)).refine(value => {
    const age = Date.now() - value.getTime();
    return age >= -15_000 && age <= 120_000;
  }, "Send a recent GPS reading."),
});
