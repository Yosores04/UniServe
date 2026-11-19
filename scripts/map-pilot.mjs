import assert from "node:assert/strict";
import { setDefaultResultOrder } from "node:dns";
import { setTimeout as wait } from "node:timers/promises";

// The local demo API binds IPv4 loopback. This pilot never uses a remote API.
setDefaultResultOrder("ipv4first");
const origin = "http://localhost:3001";
const shopName = "Map Pilot Test Stall";
const productName = "Simulated parcel";
const pickup = { latitude: 8.157416, longitude: 125.12485 };
const dropoff = { latitude: 8.15798, longitude: 125.12565 };

function session() {
  let cookie;
  return async (method, path, body) => {
    const response = await fetch(origin + path, {
      method,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: { ...(cookie && { cookie }), ...(body && { "content-type": "application/json" }) },
      body: body && JSON.stringify(body),
    });
    const payload = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      const error = new Error(`${method} ${path} returned ${response.status}: ${payload?.message ?? response.statusText}`);
      error.status = response.status;
      throw error;
    }
    const assigned = response.headers.get("set-cookie");
    if (assigned) cookie = assigned.split(";")[0];
    return payload;
  };
}

async function pilot() {
  const seller = session(), buyer = session(), rider = session(), admin = session();
  const health = await buyer("GET", "/api/health");
  assert.equal(health.service, "uniserve-api");
  const login = (request, email, password) => request("POST", "/api/auth/login", { email, password });
  await Promise.all([
    login(buyer, "customer@uniserve.local", "Customer123!"),
    login(rider, "rider@uniserve.local", "Rider123!"),
    login(admin, "admin@uniserve.local", "Admin123!"),
  ]);
  const email = "map.pilot.seller@uniserve.local", password = "MapPilot123!";
  try { await login(seller, email, password); }
  catch (error) {
    if (error.status !== 401) throw error;
    await seller("POST", "/api/auth/register", { email, password, name: "Map Pilot Test Seller", role: "CUSTOMER" });
  }
  let { shop } = await seller("GET", "/api/shop/profile");
  if (!shop) {
    ({ shop } = await seller("POST", "/api/shop/applications", {
      name: shopName, category: "Campus test stall", location: "Test stall pickup",
      operatingHours: "Local demonstration only", pin: pickup, product: { name: productName, price: 1 },
    }));
  }
  assert.equal(shop.name, shopName, "The dedicated pilot account must own the test stall.");
  const item = shop.items.find((candidate) => candidate.name === productName);
  assert.ok(item, "The test stall needs its simulated parcel item.");
  if (shop.verification !== "VERIFIED") await admin("PATCH", `/api/admin/shops/${shop.id}/verification`, { verification: "VERIFIED" });
  if (!shop.open || shop.latitude !== pickup.latitude || shop.longitude !== pickup.longitude) {
    await seller("PATCH", "/api/shop/profile", { open: true, pin: pickup });
  }
  if (!item.available) await seller("PATCH", `/api/shop/items/${item.id}`, { available: true });
  const { profile } = await rider("GET", "/api/rider/profile");
  assert.ok(profile.verified, "Verify the seeded demo courier before running the map pilot.");
  if (profile.availability !== "ONLINE") await rider("PATCH", "/api/rider/availability", { availability: "ONLINE" });
  try {
    const { order } = await buyer("POST", "/api/customer/orders", {
      shopId: shop.id, serviceType: "Errand", items: [{ shopItemId: item.id, quantity: 1 }],
      paymentMethod: "COD", pickupPoint: "Test stall pickup", dropoffPoint: "Simulated campus drop-off",
      dropoffPin: dropoff, customerNote: "Map pilot test order with simulated GPS. No physical delivery.",
    });
    const read = `/api/customer/orders/${order.id}/location`;
    const delivery = `/api/rider/deliveries/${order.id}`;
    assert.equal(order.pickupLatitude, pickup.latitude);
    assert.equal(order.dropoffLongitude, dropoff.longitude);
    console.log(`Created test order ${order.id} at ${shopName}. Open My orders → Track delivery.`);
    await seller("PATCH", `/api/shop/orders/${order.id}/status`, { status: "PREPARING" });
    await rider("POST", `/api/rider/jobs/${order.id}/accept`);
    console.log("Courier accepted. Test stall is preparing the simulated parcel.");
    const simulateFix = async (point, stage) => {
      const fix = { ...point, recordedAt: new Date().toISOString() };
      await rider("PATCH", delivery + "/location", fix);
      assert.deepEqual((await buyer("GET", read)).location, fix);
      console.log(`Simulated GPS · ${stage} · ${point.latitude}, ${point.longitude}`);
    };
    await simulateFix(pickup, "at test stall");
    await wait(14000);
    await seller("PATCH", `/api/shop/orders/${order.id}/status`, { status: "READY_FOR_PICKUP" });
    await rider("PATCH", delivery + "/status", { status: "PICKED_UP" });
    await rider("PATCH", delivery + "/status", { status: "ON_THE_WAY" });
    await simulateFix({ latitude: 8.15770, longitude: 125.12524 }, "on the way");
    await wait(14000);
    await simulateFix(dropoff, "arrived at simulated drop-off");
    await wait(12000);
    const result = await rider("PATCH", delivery + "/status", { status: "DELIVERED" });
    assert.equal(result.order.status, "DELIVERED");
    assert.equal((await buyer("GET", read)).location, null);
    console.log("Delivered. Verified the customer can no longer read a courier position.");
  } finally {
    if (profile.availability !== "ONLINE") await rider("PATCH", "/api/rider/availability", { availability: profile.availability });
  }
}

pilot().catch((error) => { console.error(error.message); process.exitCode = 1; });
