ALTER TABLE "Shop" ADD COLUMN "latitude" REAL;
ALTER TABLE "Shop" ADD COLUMN "longitude" REAL;
ALTER TABLE "Order" ADD COLUMN "pickupLatitude" REAL;
ALTER TABLE "Order" ADD COLUMN "pickupLongitude" REAL;
ALTER TABLE "Order" ADD COLUMN "dropoffLatitude" REAL;
ALTER TABLE "Order" ADD COLUMN "dropoffLongitude" REAL;

CREATE TABLE "CourierLocation" (
    "orderId" TEXT NOT NULL PRIMARY KEY,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "recordedAt" DATETIME NOT NULL,
    CONSTRAINT "CourierLocation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
