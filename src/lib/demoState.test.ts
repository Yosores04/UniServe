import { describe, expect, it } from "vitest";
import {
  acceptOrder,
  advanceOrderStatus,
  cancelOrder,
  createDemoState,
  acceptStoreOrder,
  addOrderMessage,
  placeOrder,
  rateOrder,
  resolveComplaint,
  setCourierAvailability,
  setPaymentMethod,
  setStoreOpen,
  setStoreOrderStatus
} from "./demoState";

describe("BukSU Courier demo state", () => {
  it("places a customer order and recalculates admin totals", () => {
    const state = createDemoState();

    const next = placeOrder(state, {
      serviceType: "Printing",
      storeId: "print-hub",
      items: ["Printed research paper"],
      pickupPoint: "Student Center",
      dropoffPoint: "College of Technologies",
      customerNote: "Long bond, 2 copies, staple each copy"
    });

    const newest = next.orders[0];
    expect(newest.serviceType).toBe("Printing");
    expect(newest.status).toBe("Pending");
    expect(newest.paymentMethod).toBe("COD");
    expect(next.stats.totalOrders).toBe(state.stats.totalOrders + 1);
    expect(next.stats.availableOrders).toBe(state.stats.availableOrders + 1);
  });

  it("assigns an available courier and moves the delivery through the pitch flow", () => {
    const state = createDemoState();

    const assigned = acceptOrder(state, "order-1001", "courier-1");
    const activeOrder = assigned.orders.find((order) => order.id === "order-1001");
    const activeCourier = assigned.couriers.find((courier) => courier.id === "courier-1");

    expect(activeOrder?.courierId).toBe("courier-1");
    expect(activeOrder?.status).toBe("Accepted");
    expect(activeCourier?.availability).toBe("Busy");
    expect(assigned.stats.activeCouriers).toBe(state.stats.activeCouriers - 1);

    const pickedUp = advanceOrderStatus(assigned, "order-1001");
    expect(pickedUp.orders.find((order) => order.id === "order-1001")?.status).toBe("Picked up");

    const delivered = advanceOrderStatus(
      advanceOrderStatus(pickedUp, "order-1001"),
      "order-1001"
    );

    expect(delivered.orders.find((order) => order.id === "order-1001")?.status).toBe("Delivered");
    expect(delivered.couriers.find((courier) => courier.id === "courier-1")?.availability).toBe("Available");
    expect(delivered.couriers.find((courier) => courier.id === "courier-1")?.earningsToday).toBeGreaterThan(
      activeCourier?.earningsToday ?? 0
    );
  });

  it("lets a store update preparation state and a courier toggle availability", () => {
    const state = createDemoState();

    const preparing = setStoreOrderStatus(state, "order-1002", "Preparing");
    expect(preparing.orders.find((order) => order.id === "order-1002")?.storeStatus).toBe("Preparing");

    const offline = setCourierAvailability(preparing, "courier-2", "Offline");
    expect(offline.couriers.find((courier) => courier.id === "courier-2")?.availability).toBe("Offline");
    expect(offline.stats.activeCouriers).toBe(preparing.stats.activeCouriers - 1);
  });

  it("cancels only pending customer orders", () => {
    const state = createDemoState();
    const next = cancelOrder(state, "order-1001");

    expect(next.orders.some((order) => order.id === "order-1001")).toBe(false);
    expect(next.stats.totalOrders).toBe(state.stats.totalOrders - 1);
    expect(cancelOrder(state, "order-1002")).toBe(state);
  });

  it("updates payment method and allows ratings only after delivery", () => {
    const state = createDemoState();
    const paid = setPaymentMethod(state, "order-1001", "E-wallet");
    expect(paid.orders.find((order) => order.id === "order-1001")?.paymentMethod).toBe("E-wallet");
    expect(rateOrder(state, "order-1001", 5)).toBe(state);

    const delivered = advanceOrderStatus(
      advanceOrderStatus(
        advanceOrderStatus(advanceOrderStatus(acceptOrder(state, "order-1001", "courier-1"), "order-1001"), "order-1001"),
        "order-1001"
      ),
      "order-1001"
    );
    expect(rateOrder(delivered, "order-1001", 5).orders.find((order) => order.id === "order-1001")?.rating).toBe(5);
  });

  it("updates store availability, accepts new store orders, and resolves complaints", () => {
    const state = createDemoState();
    expect(setStoreOpen(state, "canteen-express", false).stores[0].status).toBe("Closed");
    expect(acceptStoreOrder(state, "order-1002").orders.find((order) => order.id === "order-1002")?.storeStatus).toBe("Preparing");
    expect(resolveComplaint(state, "complaint-1").complaints.find((complaint) => complaint.id === "complaint-1")?.status).toBe("Resolved");
    expect(resolveComplaint(state, "missing")).toBe(state);
  });

  it("adds chat messages to an existing order only", () => {
    const state = createDemoState();
    const next = addOrderMessage(state, "order-1001", "Customer", "Please call when you arrive.");
    const messages = next.orders[0].chat ?? [];
    expect(messages[messages.length - 1]?.message).toBe("Please call when you arrive.");
    expect(addOrderMessage(state, "missing", "Customer", "Hello")).toBe(state);
  });
});
