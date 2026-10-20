import { useState } from "react";
import { Coffee, PackageCheck, Printer, ShoppingBag, Store } from "lucide-react";
import { EmptyState, Panel, PanelHeader, money } from "../../components/DemoKit";
import type { LiveOrder, Mutate, Workspace } from "../../lib/workspace";
import { OrderDetails } from "./OrderDetails";

const points = ["Main Gate", "Student Center", "University Library", "College of Technologies", "Admin Building", "Main Canteen", "Business Building"];

export function Marketplace({ data, mutate, section, onSectionChange, busy = false }: { data: Workspace; mutate: Mutate; section: string; onSectionChange: (section: string) => void; busy?: boolean; actionError?: string }) {
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
  const itemCount = selected.reduce((total, item) => total + quantities[item.id], 0);
  const orders = data.orders.filter((order) => filter === "All" || (filter === "Active" ? !["DELIVERED", "CANCELLED"].includes(order.status) : ["DELIVERED", "CANCELLED"].includes(order.status)));

  function reorder(order: LiveOrder) {
    const original = data.shops.find((candidate) => candidate.id === order.shopId);
    if (!original) { setNotice("This shop is no longer available. Choose another seller."); return; }
    setShopId(original.id); setService(order.serviceType); setDropoff(order.dropoffPoint); setNote(order.customerNote ?? ""); setPayment(order.paymentMethod);
    setQuantities(Object.fromEntries(order.items.filter((item) => item.shopItemId).map((item) => [item.shopItemId!, item.quantity])));
    setNotice("Order details copied. Review current prices and availability before placing your order.");
    onSectionChange("marketplace");
  }

  return <div className="workspace-stack">
    {notice && <div className="live-notice" role="status"><span>{notice}</span><button type="button" className="chip-button" onClick={() => setNotice("")}>Dismiss</button></div>}
    <div hidden={section === "orders"} className="workspace-stack">
      <Panel><PanelHeader icon={ShoppingBag} eyebrow="Made for your campus day" title="Campus marketplace" /><p className="section-description">Discover student businesses, everyday essentials, and campus services.</p>
        <label className="search-field">Search shops and products<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cookies, printing, school supplies…" /></label>
        <div className="shop-grid">{matches.map((item) => {
          const Icon = /print/i.test(item.category) ? Printer : /food|drink|coffee/i.test(item.category) ? Coffee : Store;
          return <button type="button" key={item.id} className={`shop-card ${item.id === shop?.id ? "selected" : ""}`} aria-pressed={item.id === shop?.id} onClick={() => { setShopId(item.id); setNotice(""); }}>
            <span className="shop-visual"><Icon size={32} aria-hidden="true" /><span className="badge" data-tone={item.open ? "success" : "neutral"}>{item.open ? "Open" : "Closed"}</span></span><span className="shop-category">{item.category}</span><strong>{item.name}</strong><span className="shop-meta">{item.location}</span><span className="shop-meta">{item.operatingHours} · {item.items.filter((product) => product.available).length} products</span>
          </button>;
        })}</div>
        {!matches.length && <EmptyState text={data.shops.length ? "No shops or products match your search." : "No verified shops yet. Check back after an entrepreneur is approved."} />}
      </Panel>
      {shop && <form id="marketplace-checkout" className="checkout-layout" onSubmit={async (event) => {
        event.preventDefault(); if (busy) return; setNotice("");
        if (!selected.length) { setNotice("Add at least one available product."); return; }
        if (dropoff.trim() === shop.location.trim()) { setNotice("Choose a drop-off different from the pickup location."); return; }
        const ok = await mutate("/api/customer/orders", { shopId: shop.id, serviceType: service, pickupPoint: shop.location, dropoffPoint: dropoff.trim(), customerNote: note.trim(), paymentMethod: payment, items: selected.map((item) => ({ shopItemId: item.id, quantity: quantities[item.id] })) });
        if (ok) { setQuantities({}); setNote(""); setNotice("Order placed. Track progress in My orders."); }
        else setNotice("Unable to place your order. Your selection has been kept; please try again.");
      }}>
        <Panel><PanelHeader icon={Store} eyebrow="Selected shop" title={shop.name} /><p className="section-description">{shop.location} · {shop.operatingHours}</p>
          {!shop.open && <p className="live-warning">This shop is closed. You can browse and order when it reopens.</p>}
          <div className="catalog-list">{shop.items.map((item) => <article className="catalog-row" key={item.id}><span className="product-avatar" aria-hidden="true">{item.name.slice(0, 2).toUpperCase()}</span><div className="product-info"><strong>{item.name}</strong><span className="section-description">{item.available ? "Available" : "Unavailable"}</span></div><span className="price-label">{money(item.price)}</span><label className="quantity-field"><span>Qty</span><input aria-label={`Quantity for ${item.name}`} type="number" min={0} max={99} step={1} disabled={!shop.open || !item.available} value={quantities[item.id] ?? 0} onChange={(event) => setQuantities({ ...quantities, [item.id]: Math.max(0, Math.min(99, Math.floor(Number(event.target.value)))) })} /></label></article>)}</div>
          {!shop.items.length && <EmptyState text="This seller has not added products yet." />}
        </Panel>
        <Panel className="checkout-summary"><PanelHeader icon={ShoppingBag} eyebrow={`${itemCount} ${itemCount === 1 ? "item" : "items"} selected`} title="Your order" />
          {selected.length ? selected.map((item) => <div className="summary-line" key={item.id}><span>{quantities[item.id]} × {item.name}</span><strong>{money(item.price * quantities[item.id])}</strong></div>) : <p className="section-description">Choose a quantity to add products to your order.</p>}
          <div className="form-grid">
            <label>Service<select value={service} onChange={(event) => setService(event.target.value)}>{["Marketplace", "Food", "Printing", "Errand"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Payment<select value={payment} onChange={(event) => setPayment(event.target.value)}><option value="COD">Cash on delivery</option><option value="EWALLET">E-wallet</option></select></label>
            <label>Pickup<input value={shop.location} readOnly /></label>
            <label>Drop-off<input required maxLength={120} list="campus-locations" value={dropoff} onChange={(event) => setDropoff(event.target.value)} /><datalist id="campus-locations">{points.map((point) => <option key={point} value={point} />)}</datalist></label>
          </div>
          <label>Instructions<textarea maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Delivery notes or request details" /></label>
          <div className="summary-line"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-line"><span>Delivery fee</span><span>{money(selected.length ? fee : 0)}</span></div><div className="total-line"><strong>Total</strong><strong>{money(selected.length ? subtotal + fee : 0)}</strong></div>
          <button className="primary-button full" disabled={busy || !shop.open || !selected.length}>{busy ? "Placing order…" : "Place order"}</button><p className="section-description">E-wallet payments are arranged separately.</p>
        </Panel>
      </form>}
    </div>
    <div hidden={section !== "orders"}><Panel><PanelHeader icon={PackageCheck} eyebrow="Track your requests" title="My orders" /><div className="filter-row">{["All", "Active", "History"].map((value) => <button type="button" key={value} aria-pressed={filter === value} className={`chip-button ${filter === value ? "selected" : ""}`} onClick={() => setFilter(value)}>{value}</button>)}</div><div className="live-order-grid">{orders.map((order) => <OrderDetails key={order.id} order={order} role="customer" mutate={mutate} onReorder={reorder} />)}</div>{!orders.length && <EmptyState text="No orders to display. Your requests will appear here." />}</Panel></div>
  </div>;
}
