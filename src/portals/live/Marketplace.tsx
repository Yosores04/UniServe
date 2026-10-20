import { useState } from "react";
import { PackageCheck, ShoppingBag } from "lucide-react";
import { EmptyState, Panel, PanelHeader, money } from "../../components/DemoKit";
import type { LiveOrder, Mutate, Workspace } from "../../lib/workspace";
import { OrderDetails } from "./OrderDetails";

const points = ["Main Gate", "Student Center", "University Library", "College of Technologies", "Admin Building", "Main Canteen", "Business Building"];

export function Marketplace({ data, mutate }: { data: Workspace; mutate: Mutate }) {
  const [search, setSearch] = useState("");
  const [shopId, setShopId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [service, setService] = useState("Marketplace");
  const [dropoff, setDropoff] = useState("College of Technologies");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState("COD");
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState("");
  const shop = data.shops.find((item) => item.id === shopId) ?? data.shops[0];
  const matches = data.shops.filter((item) => `${item.name} ${item.category} ${item.items.map((product) => product.name).join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const selected = shop?.items.filter((item) => item.available && quantities[item.id] > 0) ?? [];
  const subtotal = selected.reduce((total, item) => total + item.price * quantities[item.id], 0);
  const fee = service === "Errand" ? 35 : 25;
  const orders = data.orders.filter((order) => filter === "All" || (filter === "Active" ? !["DELIVERED", "CANCELLED"].includes(order.status) : ["DELIVERED", "CANCELLED"].includes(order.status)));

  function reorder(order: LiveOrder) {
    const original = data.shops.find((candidate) => candidate.id === order.shopId);
    if (!original) { setNotice("This shop is no longer available. Choose another seller."); return; }
    setShopId(original.id); setService(order.serviceType); setDropoff(order.dropoffPoint); setNote(order.customerNote ?? ""); setPayment(order.paymentMethod);
    setQuantities(Object.fromEntries(order.items.filter((item) => item.shopItemId).map((item) => [item.shopItemId!, item.quantity])));
    setNotice("Order details copied. Review current prices and availability before placing your order.");
    document.getElementById("marketplace-checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <div className="dashboard-grid">
    {notice && <p className="live-notice span-12" role="status">{notice}<button type="button" className="chip-button" onClick={() => setNotice("")}>Dismiss</button></p>}
    <Panel className="span-12"><PanelHeader icon={ShoppingBag} eyebrow="Student entrepreneurs" title="Campus marketplace" />
      <p>Discover student businesses and campus services. Choose a shop, then add products to your order.</p>
      <label className="live-search">Search shops and products<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cookies, printing, school supplies…" /></label>
      <div className="live-shop-grid">{matches.map((item) => <button type="button" key={item.id} className={`live-shop-card ${item.id === shop?.id ? "selected" : ""}`} aria-pressed={item.id === shop?.id} onClick={() => { setShopId(item.id); setQuantities({}); setNotice(""); }}>
        <span className="eyebrow">{item.category}</span><strong>{item.name}</strong><span>{item.location}</span><span>{item.operatingHours}</span><span className="live-shop-state">{item.open ? "Open" : "Closed"} · {item.items.filter((product) => product.available).length} products</span>
      </button>)}</div>
      {!matches.length && <EmptyState text={data.shops.length ? "No shops or products match your search." : "No verified shops yet. Check back after an entrepreneur is approved."} />}
    </Panel>
    {shop && <Panel className="span-7"><div id="marketplace-checkout"><PanelHeader icon={ShoppingBag} eyebrow="Products & checkout" title={shop.name} /></div>
      {!shop.open && <p className="live-warning">This shop is closed. You can browse and order when it reopens.</p>}
      <form onSubmit={async (event) => {
        event.preventDefault(); setNotice("");
        if (!selected.length) { setNotice("Add at least one available product."); return; }
        if (dropoff.trim() === shop.location.trim()) { setNotice("Choose a drop-off different from the pickup location."); return; }
        const ok = await mutate("/api/customer/orders", { shopId: shop.id, serviceType: service, pickupPoint: shop.location, dropoffPoint: dropoff.trim(), customerNote: note.trim(), paymentMethod: payment, items: selected.map((item) => ({ shopItemId: item.id, quantity: quantities[item.id] })) });
        if (ok) { setQuantities({}); setNote(""); setNotice("Order placed. Your seller and courier can now see it."); }
      }}>
        <div className="live-products">{shop.items.map((item) => <label className="live-product" key={item.id}>
          <span><strong>{item.name}</strong><small>{money(item.price)} · {item.available ? "Available" : "Unavailable"}</small></span>
          <input aria-label={`Quantity for ${item.name}`} type="number" min={0} max={99} step={1} disabled={!shop.open || !item.available} value={quantities[item.id] ?? 0} onChange={(event) => setQuantities({ ...quantities, [item.id]: Math.max(0, Math.min(99, Math.floor(Number(event.target.value)))) })} />
        </label>)}</div>
        {!shop.items.length && <EmptyState text="This seller has not added products yet." />}
        <div className="form-grid">
          <label>Service<select value={service} onChange={(event) => setService(event.target.value)}>{["Marketplace", "Food", "Printing", "Errand"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Payment<select value={payment} onChange={(event) => setPayment(event.target.value)}><option value="COD">Cash on delivery</option><option value="EWALLET">E-wallet (arrange payment separately)</option></select></label>
          <label>Pickup<input value={shop.location} readOnly /></label>
          <label>Drop-off<input required maxLength={120} list="campus-locations" value={dropoff} onChange={(event) => setDropoff(event.target.value)} /><datalist id="campus-locations">{points.map((point) => <option key={point} value={point} />)}</datalist></label>
        </div>
        <label className="live-label">Instructions<textarea maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Delivery notes or details for a printing/errand request" /></label>
        <div className="checkout-bar"><span>Items {money(subtotal)} + delivery {money(fee)}<strong>{money(subtotal + fee)}</strong></span><button className="primary-button" disabled={!shop.open || !selected.length}>Place order</button></div>
        <p className="live-muted">E-wallet payments are arranged separately; this demo does not collect money online.</p>
      </form>
    </Panel>}
    <Panel className={shop ? "span-5" : "span-12"}><PanelHeader icon={PackageCheck} eyebrow="Your requests" title="Order tracking & history" />
      <div className="filter-row">{["All", "Active", "Completed"].map((value) => <button key={value} className={`chip-button ${filter === value ? "selected" : ""}`} onClick={() => setFilter(value)}>{value}</button>)}</div>
      <div className="order-list">{orders.map((order) => <OrderDetails key={order.id} order={order} role="customer" mutate={mutate} onReorder={reorder} />)}</div>
      {!orders.length && <EmptyState text="No orders to display. Your requests will appear here." />}
    </Panel>
  </div>;
}
