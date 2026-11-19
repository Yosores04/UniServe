import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ClipboardCheck, Coffee, Footprints, MapPin, PackageCheck, Printer, ShoppingBag, Store } from "lucide-react";
import { EmptyState, Panel, PanelHeader, money } from "../../components/DemoKit";
import type { LiveOrder, Mutate, Product, Shop, Workspace } from "../../lib/workspace";
import { OrderDetails, statusLabel } from "./OrderDetails";
import CampusMap, { PinPicker } from "../../components/maps/CampusMap";
import { mapPoint, type MapPoint } from "../../lib/workspace";
import "./marketplace.css";

const points = ["Main Gate", "Student Center", "University Library", "College of Technologies", "Admin Building", "Main Canteen", "Business Building"];
const services = [
  { name: "Food", label: "Food", icon: Coffee, match: /food|meal|canteen|snack|coffee|drink|bak(e|ery)|pastr|treat|dessert|café|cafe/i },
  { name: "Printing", label: "Printing", icon: Printer, match: /print|photocopy|xerox|binding/i },
  { name: "Errand", label: "Errands", icon: Footprints, match: /errand|collect|pick[ -]?up|courier|drop[ -]?off/i },
  { name: "Marketplace", label: "All shops", icon: ShoppingBag, match: null },
] as const;

type Step = "browse" | "catalog" | "basket" | "review";
type Service = typeof services[number]["name"];
type View = { step: Step; service: Service; shopId: string };
const home: View = { step: "browse", service: "Marketplace", shopId: "" };
const active = (order: LiveOrder) => order.status !== "CANCELLED" && order.status !== "DELIVERED";

function productsFor(shop: Shop, service: Service) {
  const pattern = services.find((item) => item.name === service)?.match;
  if (!pattern || pattern.test(shop.category + " " + shop.name)) return shop.items;
  return shop.items.filter((product) => pattern.test(product.name));
}

function historyView(): View {
  return typeof window !== "undefined" && window.history.state?.marketView || home;
}

export function Marketplace({ data, mutate, section, onSectionChange, busy = false }: { data: Workspace; mutate: Mutate; section: string; onSectionChange: (section: string) => void; busy?: boolean; actionError?: string }) {
  const [view, setView] = useState<View>(historyView);
  const [search, setSearch] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [dropoff, setDropoff] = useState("College of Technologies");
  const [dropoffPin, setDropoffPin] = useState<MapPoint | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [selectedStall, setSelectedStall] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState("COD");
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState("");
  const { step, service, shopId } = view;
  const shop = data.shops.find((item) => item.id === shopId);
  const selected = shop?.items.filter((item) => item.available && quantities[item.id] > 0) ?? [];
  const subtotal = selected.reduce((sum, item) => sum + item.price * quantities[item.id], 0);
  const fee = service === "Errand" ? 35 : 25;
  const count = selected.reduce((sum, item) => sum + quantities[item.id], 0);
  const query = search.trim().toLowerCase();
  const shops = data.shops.flatMap((seller) => {
    const products = productsFor(seller, service);
    const pattern = services.find((item) => item.name === service)?.match;
    if (pattern && !products.length && !pattern.test(seller.category + " " + seller.name)) return [];
    const hits = query ? products.filter((item) => item.name.toLowerCase().includes(query)) : [];
    if (query && !hits.length && ![seller.name, seller.category, seller.location].some((value) => value.toLowerCase().includes(query))) return [];
    return [{ seller, hits, products }];
  });
  const catalog = shop ? productsFor(shop, service).filter((item) => item.name.toLowerCase().includes(catalogSearch.trim().toLowerCase())) : [];
  const markers = shops.flatMap(({ seller }) => {
    const point = mapPoint(seller.latitude, seller.longitude);
    return point ? [{ id: seller.id, label: seller.name, ...point }] : [];
  });
  const highlighted = shops.find(({ seller }) => seller.id === selectedStall)?.seller;
  const newestFirst = [...data.orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const latest = newestFirst.find(active);
  const orders = newestFirst.filter((order) => filter === "All" || (filter === "Active" ? active(order) : !active(order)));

  useEffect(() => {
    const restore = () => {
      if (window.location.hash === "#marketplace") { setView(historyView()); setNotice(""); }
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  function navigate(next: View, push = true) {
    setView(next);
    setNotice("");
    const state = { ...window.history.state, marketView: next };
    if (push) window.history.pushState(state, "", window.location.href);
    else window.history.replaceState(state, "", window.location.href);
    requestAnimationFrame(() => document.getElementById("market-step")?.focus());
  }

  function openShop(seller: Shop, product?: Product) {
    setCatalogSearch(product?.name ?? "");
    navigate({ ...view, shopId: seller.id, step: "catalog" });
  }

  function reorder(order: LiveOrder) {
    if (!data.shops.some((candidate) => candidate.id === order.shopId)) {
      setNotice("This shop is no longer available. Choose another seller."); return;
    }
    const original = data.shops.find((candidate) => candidate.id === order.shopId)!;
    setQuantities((previous) => ({
      ...previous, ...Object.fromEntries(original.items.map((item) => [item.id, 0])),
      ...Object.fromEntries(order.items.filter((item) => item.shopItemId).map((item) => [item.shopItemId!, item.quantity])),
    }));
    setDropoff(order.dropoffPoint); setNote(order.customerNote ?? ""); setPayment(order.paymentMethod);
    setDropoffPin(mapPoint(order.dropoffLatitude, order.dropoffLongitude));
    setCatalogSearch("");
    onSectionChange("marketplace");
    navigate({ shopId: order.shopId, service: services.find((item) => item.name === order.serviceType)?.name ?? "Marketplace", step: "basket" }, false);
    setNotice("Order details copied. Review current prices and availability.");
  }

  async function checkout(event: FormEvent) {
    event.preventDefault();
    if (busy || !shop) return;
    if (!shop.open || !selected.length) { setNotice("Choose an available item from an open shop."); return; }
    if (!dropoff.trim() || dropoff.trim().toLowerCase() === shop.location.trim().toLowerCase()) {
      setNotice("Enter a drop-off different from the pickup location."); return;
    }
    if (step === "basket") { navigate({ ...view, step: "review" }); return; }
    if (step !== "review") return;
    const ok = await mutate("/api/customer/orders", {
      shopId, serviceType: service, pickupPoint: shop.location, dropoffPoint: dropoff.trim(),
      customerNote: note.trim(), paymentMethod: payment, dropoffPin,
      items: selected.map((item) => ({ shopItemId: item.id, quantity: quantities[item.id] })),
    });
    if (!ok) { setNotice("Unable to place your order. Your basket is saved here."); return; }
    setQuantities((previous) => ({ ...previous, ...Object.fromEntries(shop.items.map((item) => [item.id, 0])) }));
    setNote(""); setFilter("Active"); setCatalogSearch("");
    navigate(home, false);
    onSectionChange("orders");
    setNotice("Order placed. You can track your delivery below.");
  }

  const basketButton = <button type="button" className="primary-button market-basket-button" disabled={!count} onClick={() => navigate({ ...view, step: "basket" })}>
    <ShoppingBag size={17} />View basket ({count})<strong>{money(subtotal)}</strong>
  </button>;
  function productRow(item: Product) {
    const quantity = quantities[item.id] ?? 0;
    return <article className="catalog-row" key={item.id}>
      <div className="product-info"><strong>{item.name}</strong><span>{money(item.price)}{!item.available && " · Unavailable"}</span></div>
      <div className="market-quantity">
        <button type="button" aria-label={`Remove one ${item.name}`} disabled={!quantity} onClick={() => setQuantities((old) => ({ ...old, [item.id]: Math.max(0, (old[item.id] ?? 0) - 1) }))}>−</button>
        <input aria-label={`Quantity for ${item.name}`} type="number" inputMode="numeric" min={0} max={99} disabled={!shop?.open || !item.available} value={quantity} onChange={(event) => {
          const value = Math.min(99, Math.max(0, Math.floor(Number(event.target.value) || 0)));
          setQuantities((old) => ({ ...old, [item.id]: value }));
        }} />
        <button type="button" aria-label={`Add one ${item.name}`} disabled={!shop?.open || !item.available || quantity >= 99} onClick={() => setQuantities((old) => ({ ...old, [item.id]: Math.min(99, (old[item.id] ?? 0) + 1) }))}>+</button>
      </div>
    </article>;
  }

  return <div className="workspace-stack market-workspace" id="market-step" tabIndex={-1}>
    {notice && <div className="live-notice" role="status"><span>{notice}</span><button type="button" className="chip-button" onClick={() => setNotice("")}>Dismiss</button></div>}
    {section === "marketplace" && (step === "browse" || !shop ? <>
      <Panel>
        <h2>Browse shops</h2>
        <div className="market-services">{services.map(({ name, label, icon: Icon }) =>
          <button key={name} type="button" aria-pressed={service === name} onClick={() => {
            setSearch(""); setCatalogSearch(""); navigate({ step: "browse", service: name, shopId: service === name ? shopId : "" }, false);
          }}><Icon size={22} /><strong>{label}</strong></button>)}</div>
        <label className="search-field">Search shops and products<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Shop or product name" /></label>
        <div className="filter-row" aria-label="Shop display">
          <button type="button" className="chip-button" aria-pressed={!mapVisible} onClick={() => setMapVisible(false)}>List</button>
          <button type="button" className="chip-button" aria-pressed={mapVisible} onClick={() => setMapVisible(true)}><MapPin size={16} />Map</button>
        </div>
        {mapVisible ? <>
          <CampusMap markers={markers} onSelect={setSelectedStall} />
          {shops.length > markers.length && <p className="section-description">{shops.length - markers.length} matching shops have no pickup pin yet. Find them in List.</p>}
          {highlighted && <article className="market-shop"><button type="button" className="market-shop-link" onClick={() => openShop(highlighted)}>
            <strong>{highlighted.name}</strong><span>{highlighted.open ? "Open" : "Closed"} · {highlighted.location}</span>
            <span className="market-shop-action">View products <ArrowRight size={15} /></span>
          </button></article>}
        </> : <div className="market-shops">{shops.map(({ seller, hits, products }) =>
          <article key={seller.id} className="market-shop">
            <button className="market-shop-link" type="button" onClick={() => openShop(seller)}>
              <span className="market-shop-heading"><strong>{seller.name}</strong><span className="badge" data-tone={seller.open ? "success" : "neutral"}>{seller.open ? "Open" : "Closed"}</span></span>
              <span>{seller.category}</span><span><MapPin size={14} />{seller.location}</span>
              <span>{seller.operatingHours} · {products.filter((item) => item.available).length} available</span>
              <span className="market-shop-action">Browse products <ArrowRight size={15} /></span>
            </button>
            {hits.map((item) => <button className="market-hit" key={item.id} type="button" onClick={() => openShop(seller, item)}><span>{item.name}</span><strong>{money(item.price)}</strong></button>)}
          </article>)}</div>}
        {!shops.length && <EmptyState text={data.shops.length ? "No shops or products match. Try another service or search." : "No verified shops yet."} />}
      </Panel>
      {!!count && basketButton}
      {latest && <button className="market-track" type="button" onClick={() => { setFilter("Active"); onSectionChange("orders"); }}>
        <PackageCheck /><span><small>Track order</small><strong>{latest.shop?.name ?? "Campus order"}</strong><span>{statusLabel(latest.status)} · {latest.dropoffPoint}</span></span><ArrowRight size={18} />
      </button>}
    </> : <>
      <div className="market-controls"><button type="button" className="secondary-button" onClick={() => navigate({ ...view, step: step === "catalog" ? "browse" : step === "review" ? "basket" : "catalog" }, false)}><ArrowLeft size={15} />{step === "catalog" ? "Back to shops" : step === "basket" ? "Back to products" : "Edit basket"}</button>
      <span>{service === "Errand" ? "Errands" : service}</span></div>
      {step === "catalog" ? <>
        <Panel><PanelHeader icon={Store} eyebrow={shop.category} title={shop.name} /><p className="section-description">{shop.location} · {shop.operatingHours}</p>
          {!shop.open && <p className="live-warning">This shop is closed. Ordering resumes when it reopens.</p>}
          <label className="search-field">Search this shop<input type="search" value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Product name" /></label>
          <div className="catalog-list">{catalog.map(productRow)}</div>
          {!catalog.length && <EmptyState text="No matching products in this shop." />}
        </Panel>
        {basketButton}
      </> : <form id="marketplace-checkout" className="market-checkout" onSubmit={checkout}>
        <Panel><PanelHeader icon={step === "review" ? ClipboardCheck : ShoppingBag} eyebrow={shop.name} title={step === "review" ? "Review your order" : "Your basket"} />
          {!shop.open && <p className="live-warning">This shop is currently closed.</p>}
          {step === "basket" ? <><div className="catalog-list">{selected.map(productRow)}</div>
            {!count && <EmptyState text="Your basket is empty. Browse products to add an item." />}
            <div className="form-grid">
              <label>Pickup<input value={shop.location} readOnly /></label>
              <label>Drop-off<input required maxLength={120} list="campus-locations" value={dropoff} onChange={(event) => setDropoff(event.target.value)} /><datalist id="campus-locations">{points.map((point) => <option key={point} value={point} />)}</datalist></label>
              <label>Payment<select value={payment} onChange={(event) => setPayment(event.target.value)}><option value="COD">Cash on delivery</option><option value="EWALLET">E-wallet</option></select></label>
            </div><PinPicker label="Drop-off pin" value={dropoffPin} onChange={setDropoffPin} />
            <label>Instructions<textarea maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Delivery notes or request details" /></label>
          </> : <><dl className="market-review"><dt>Pickup</dt><dd>{shop.location}</dd><dt>Drop-off</dt><dd>{dropoff.trim()}</dd><dt>Payment</dt><dd>{payment === "COD" ? "Cash on delivery" : "E-wallet"}</dd>{note.trim() && <><dt>Instructions</dt><dd>{note.trim()}</dd></>}</dl>
            {selected.map((item) => <div className="summary-line" key={item.id}><span>{quantities[item.id]} × {item.name}</span><strong>{money(item.price * quantities[item.id])}</strong></div>)}</>}
          {payment === "EWALLET" && <p className="section-description">E-wallet payments are arranged separately.</p>}
          <div className="summary-line"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-line"><span>Delivery fee</span><span>{money(count ? fee : 0)}</span></div>
          <div className="total-line"><strong>Total</strong><strong>{money(count ? subtotal + fee : 0)}</strong></div>
          <button className="primary-button full" disabled={busy || !shop.open || !count}>{step === "basket" ? "Review order" : busy ? "Placing order…" : "Place order"}</button>
        </Panel>
      </form>}
    </>)}
    {section === "orders" && <Panel><PanelHeader icon={PackageCheck} eyebrow="Track your requests" title="My orders" /><div className="filter-row">{["All", "Active", "History"].map((value) => <button type="button" key={value} aria-pressed={filter === value} className={`chip-button ${filter === value ? "selected" : ""}`} onClick={() => setFilter(value)}>{value}</button>)}</div><div className="live-order-grid">{orders.map((order) => <OrderDetails key={order.id} order={order} role="customer" mutate={mutate} onReorder={reorder} />)}</div>{!orders.length && <EmptyState text="No orders to display. Your requests will appear here." />}</Panel>}
  </div>;
}
