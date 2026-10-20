import { useState } from "react";
import { PackageCheck, Plus, Store } from "lucide-react";
import { EmptyState, Panel, PanelHeader, money } from "../../components/DemoKit";
import { Modal } from "../../components/workspace/Modal";
import type { Mutate, Product, Shop, Workspace } from "../../lib/workspace";
import { OrderDetails, statusLabel } from "./OrderDetails";

type Props = { data: Workspace; mutate: Mutate; section: string; onSectionChange: (section: string) => void; busy?: boolean; actionError?: string };

function ShopForm({ shop, mutate, busy }: { shop?: Shop; mutate: Mutate; busy: boolean }) {
  const [name, setName] = useState(shop?.name ?? "");
  const [category, setCategory] = useState(shop?.category ?? "Student entrepreneur");
  const [location, setLocation] = useState(shop?.location ?? "Business Building");
  const [hours, setHours] = useState(shop?.operatingHours ?? "9:00 AM - 4:00 PM");
  const [notice, setNotice] = useState("");
  return <form onSubmit={async (event) => {
    event.preventDefault(); setNotice("");
    const body = shop ? { name: name.trim(), operatingHours: hours.trim() } : { name: name.trim(), category: category.trim(), location: location.trim(), operatingHours: hours.trim() };
    setNotice(await mutate("/api/shop/profile", body, shop ? "PATCH" : "POST") ? "Shop details saved." : "Unable to save. Your changes are still here; please try again.");
  }}>
    <div className="form-grid">
      <label>Shop name<input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
      {!shop && <label>Category<input required minLength={2} maxLength={80} value={category} onChange={(event) => setCategory(event.target.value)} /></label>}
      {!shop && <label>Pickup location<input required minLength={2} maxLength={120} value={location} onChange={(event) => setLocation(event.target.value)} /></label>}
      <label>Operating hours<input required minLength={3} maxLength={120} value={hours} onChange={(event) => setHours(event.target.value)} /></label>
    </div>
    <p className="section-description">{shop ? `${shop.category} · Pickup at ${shop.location}. ` : ""}Hours are shown to customers.</p>
    <div className="form-actions"><button className="primary-button" disabled={busy}>{shop ? "Save shop details" : "Create my shop"}</button></div>
    {notice && <p role="status">{notice}</p>}
  </form>;
}

function ProductEditor({ item, mutate, busy, actionError, onClose }: { item: Product | null; mutate: Mutate; busy: boolean; actionError?: string; onClose: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [available, setAvailable] = useState(item?.available ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);
  return <Modal title={item ? "Edit product" : "Add product"} description="Set the name, price, and availability shown to customers." busy={busy || saving} error={attempted ? actionError : undefined} onClose={onClose}>
    <form onSubmit={async (event) => {
      event.preventDefault(); if (busy || saving) return; setSaving(true); setAttempted(true); setError("");
      try {
        const body = { name: name.trim(), price: Number(price), ...(item ? { available } : {}) };
        if (await mutate(item ? `/api/shop/items/${item.id}` : "/api/shop/items", body, item ? "PATCH" : "POST")) onClose();
        else setError("Unable to save this product. Your changes are still here; please try again.");
      } catch { setError("Unable to save this product. Please try again."); }
      finally { setSaving(false); }
    }}>
      <div className="form-grid">
        <label>Product name<input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Price (PHP)<input type="number" required min={1} max={100000} step={1} value={price} onChange={(event) => setPrice(event.target.value)} /></label>
        {item && <label>Availability<select value={available ? "available" : "unavailable"} onChange={(event) => setAvailable(event.target.value === "available")}><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label>}
      </div>
      {error && <p className="live-warning" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" className="secondary-button" disabled={busy || saving} onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy || saving}>{saving ? "Saving…" : item ? "Save product" : "Add product"}</button></div>
    </form>
  </Modal>;
}

export function SellerWorkspace({ data, mutate, section, onSectionChange, busy = false, actionError }: Props) {
  const shop = data.shops[0];
  const [editor, setEditor] = useState<{ item: Product | null } | null>(null);
  const [filter, setFilter] = useState("Active");
  const orders = data.orders.filter((order) => filter === "All" || (filter === "Active" ? !["DELIVERED", "CANCELLED"].includes(order.status) : ["DELIVERED", "CANCELLED"].includes(order.status)));
  if (!shop) return <Panel><PanelHeader icon={Store} eyebrow="Student entrepreneur" title="Set up your marketplace shop" /><p className="section-description">Create your shop, add products, and request administrator verification before students can order.</p><ShopForm mutate={mutate} busy={busy} /></Panel>;
  return <div className="workspace-stack">
    {shop.verification !== "VERIFIED" && <p className="live-warning">Your shop needs administrator verification before it appears in the marketplace.</p>}
    {section === "products" ? <Panel>
      <div className="section-toolbar"><PanelHeader icon={Store} eyebrow={shop.name} title="Product catalog" /><button type="button" className="primary-button" data-dialog-fallback onClick={() => setEditor({ item: null })}><Plus size={17} />Add product</button></div>
      <p className="section-description">Manage the products and services customers can order from your shop.</p>
      <div className="catalog-list">{shop.items.map((item) => <article className="catalog-row" key={item.id}><span className="product-avatar" aria-hidden="true">{item.name.slice(0, 2).toUpperCase()}</span><div className="product-info"><strong>{item.name}</strong><span className="badge" data-tone={item.available ? "success" : "neutral"}>{item.available ? "Available" : "Unavailable"}</span></div><strong className="price-label">{money(item.price)}</strong><button type="button" className="secondary-button" onClick={() => setEditor({ item })} aria-label={`Edit ${item.name}`}>Edit</button></article>)}</div>
      {!shop.items.length && <EmptyState text="Add your first product to start building your catalog." />}
    </Panel> : null}
    <div hidden={section !== "settings"}><Panel>
      <PanelHeader icon={Store} eyebrow="My business" title="Shop settings" />
      <div className="toggle-card"><div><strong>{shop.name}</strong><p className="section-description">{statusLabel(shop.verification)} · {shop.open ? "Open for orders" : "Closed for orders"}</p></div><button type="button" className="secondary-button" disabled={busy} onClick={() => void mutate("/api/shop/profile", { open: !shop.open }, "PATCH")}>{shop.open ? "Close shop" : "Open shop"}</button></div>
      <ShopForm key={shop.id} shop={shop} mutate={mutate} busy={busy} />
    </Panel></div>
    <div hidden={section === "products" || section === "settings"}><Panel><div className="section-toolbar"><PanelHeader icon={PackageCheck} eyebrow={shop.name} title="Customer orders" /><button type="button" className="secondary-button" onClick={() => onSectionChange("products")}>Manage products</button></div><p className="section-description">Prepare incoming orders and keep customers informed.</p>
      <div className="filter-row">{["Active", "History", "All"].map((value) => <button type="button" aria-pressed={filter === value} className={`chip-button ${filter === value ? "selected" : ""}`} key={value} onClick={() => setFilter(value)}>{value}</button>)}</div>
      <div className="live-order-grid">{orders.map((order) => <OrderDetails key={order.id} order={order} role="store" mutate={mutate} />)}</div>
      {!orders.length && <EmptyState text="No orders in this view. Student orders will appear here automatically." />}
    </Panel></div>
    {editor && <ProductEditor item={editor.item} mutate={mutate} busy={busy} actionError={actionError} onClose={() => setEditor(null)} />}
  </div>;
}
