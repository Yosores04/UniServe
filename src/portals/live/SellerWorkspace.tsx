import { useState } from "react";
import { PackageCheck, Store } from "lucide-react";
import { EmptyState, Panel, PanelHeader, money } from "../../components/DemoKit";
import type { Mutate, Product, Shop, Workspace } from "../../lib/workspace";
import { OrderDetails, statusLabel } from "./OrderDetails";

function ShopForm({ shop, mutate }: { shop?: Shop; mutate: Mutate }) {
  const [name, setName] = useState(shop?.name ?? "");
  const [category, setCategory] = useState(shop?.category ?? "Student entrepreneur");
  const [location, setLocation] = useState(shop?.location ?? "Business Building");
  const [hours, setHours] = useState(shop?.operatingHours ?? "9:00 AM - 4:00 PM");
  const [saved, setSaved] = useState(false);
  return <form onSubmit={async (event) => {
    event.preventDefault(); setSaved(false);
    const body = shop ? { name: name.trim(), operatingHours: hours.trim() } : { name: name.trim(), category: category.trim(), location: location.trim(), operatingHours: hours.trim() };
    if (await mutate("/api/shop/profile", body, shop ? "PATCH" : "POST")) setSaved(true);
  }}>
    <div className="form-grid">
      <label>Shop name<input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
      {!shop && <label>Category<input required minLength={2} maxLength={80} value={category} onChange={(event) => setCategory(event.target.value)} /></label>}
      {!shop && <label>Pickup location<input required minLength={2} maxLength={120} value={location} onChange={(event) => setLocation(event.target.value)} /></label>}
      <label>Operating hours<input required minLength={3} maxLength={120} value={hours} onChange={(event) => setHours(event.target.value)} /></label>
    </div>
    <p className="live-muted">Hours are shown to customers. Use the open/close control to set your availability.</p>
    <button className="primary-button">{shop ? "Save shop details" : "Create my shop"}</button>
    {saved && <span role="status" className="live-muted"> Saved.</span>}
  </form>;
}

function ProductEditor({ item, mutate }: { item: Product; mutate: Mutate }) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price));
  const [saved, setSaved] = useState(false);
  return <form className="live-product-editor" onSubmit={async (event) => {
    event.preventDefault(); setSaved(false);
    if (await mutate(`/api/shop/items/${item.id}`, { name: name.trim(), price: Number(price) }, "PATCH")) setSaved(true);
  }}>
    <label>Product name<input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
    <label>Price (PHP)<input type="number" required min={1} max={100000} step={1} value={price} onChange={(event) => setPrice(event.target.value)} /></label>
    <div className="row-actions"><button className="chip-button">Save product</button><button type="button" className="chip-button" aria-pressed={item.available} onClick={() => void mutate(`/api/shop/items/${item.id}`, { available: !item.available }, "PATCH")}>{item.available ? "Mark unavailable" : "Make available"}</button></div>
    {saved && <span className="live-muted" role="status">Saved.</span>}
  </form>;
}

export function SellerWorkspace({ data, mutate }: { data: Workspace; mutate: Mutate }) {
  const shop = data.shops[0]; // API returns only the authenticated owner's shop.
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [filter, setFilter] = useState("Active");
  const orders = data.orders.filter((order) => filter === "All" || (filter === "Active" ? !["DELIVERED", "CANCELLED"].includes(order.status) : ["DELIVERED", "CANCELLED"].includes(order.status)));
  if (!shop) return <Panel><PanelHeader icon={Store} eyebrow="Student entrepreneur" title="Set up your marketplace shop" /><p>Create your shop, add your products, and ask an administrator to verify it before students can order.</p><ShopForm mutate={mutate} /></Panel>;

  return <div className="dashboard-grid">
    <Panel className="span-5"><PanelHeader icon={Store} eyebrow="My business" title={shop.name} />
      <div className="live-badges"><span>{statusLabel(shop.verification)}</span><span>{shop.open ? "Open" : "Closed"}</span></div><p>{shop.category} · {shop.location}</p>
      {shop.verification !== "VERIFIED" && <p className="live-warning">Your shop needs admin verification before it appears in the student marketplace.</p>}
      <div className="mini-metrics"><span>{money(shop.salesToday)} sales today</span><span>{shop.rating ? `${shop.rating.toFixed(1)} / 5` : "No ratings yet"}</span></div>
      <button className="secondary-button" onClick={() => void mutate("/api/shop/profile", { open: !shop.open }, "PATCH")}>{shop.open ? "Close shop" : "Open shop"}</button>
      <ShopForm key={shop.id} shop={shop} mutate={mutate} />
    </Panel>
    <Panel className="span-7"><PanelHeader icon={Store} eyebrow="Product catalog" title="Products & availability" />
      <form className="live-add-product" onSubmit={async (event) => {
        event.preventDefault();
        if (await mutate("/api/shop/items", { name: newName.trim(), price: Number(newPrice) })) { setNewName(""); setNewPrice(""); }
      }}><label>New product<input required minLength={2} maxLength={100} value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Cookies, crafts, services…" /></label><label>Price (PHP)<input required type="number" min={1} max={100000} step={1} value={newPrice} onChange={(event) => setNewPrice(event.target.value)} /></label><button className="primary-button">Add product</button></form>
      {shop.items.map((item) => <ProductEditor key={item.id} item={item} mutate={mutate} />)}
      {!shop.items.length && <EmptyState text="Add your first product to start building your catalog." />}
    </Panel>
    <Panel className="span-12"><PanelHeader icon={PackageCheck} eyebrow="Order preparation" title="Your customer orders" />
      <div className="filter-row">{["Active", "Completed", "All"].map((value) => <button className={`chip-button ${filter === value ? "selected" : ""}`} key={value} onClick={() => setFilter(value)}>{value}</button>)}</div>
      <div className="live-order-grid">{orders.map((order) => <OrderDetails key={order.id} order={order} role="store" mutate={mutate} />)}</div>
      {!orders.length && <EmptyState text="No orders in this view. Student orders will appear here automatically." />}
    </Panel>
  </div>;
}
