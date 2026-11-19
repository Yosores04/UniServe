import { useState, type FormEvent } from "react";
import { CheckCircle2, Clock3, Mail, ShoppingBag, Store, UserRound } from "lucide-react";
import { Panel } from "../../components/DemoKit";
import { Modal } from "../../components/workspace/Modal";
import type { AuthUser } from "../../lib/auth";
import type { Mutate, Workspace } from "../../lib/workspace";
import { SellerWorkspace } from "./SellerWorkspace";
import { mapPoint, type MapPoint } from "../../lib/workspace";
import { PinPicker } from "../../components/maps/CampusMap";
import "./CustomerProfile.css";

type Props = { data: Workspace; user: AuthUser; mutate: Mutate; busy: boolean; actionError?: string };
type Profile = { name: string; email: string; phone: string | null };
const emptyApplication = { name: "", category: "", location: "", operatingHours: "", product: "", price: "", pin: null as MapPoint | null };
type Application = typeof emptyApplication;
const fields: { key: Exclude<keyof Application, "pin">; label: string; example: string }[] = [
  { key: "name", label: "Shop name", example: "Campus Bakes" },
  { key: "category", label: "Category", example: "Baked goods" },
  { key: "location", label: "Pickup location", example: "Student Center" },
  { key: "operatingHours", label: "Operating hours", example: "Mon–Fri, 9 AM–4 PM" },
  { key: "product", label: "Product name", example: "Banana bread" },
  { key: "price", label: "Price (PHP)", example: "35" },
];

function readDraft(key: string, defaults: Application): Application {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    if (saved && fields.every((field) => typeof saved[field.key] === "string")) return { ...saved, pin: mapPoint(saved.pin?.latitude, saved.pin?.longitude) };
  } catch { /* Storage may be unavailable or an old draft may be unreadable. */ }
  return defaults;
}

function ApplicationForm({ storageKey, defaults, mutate, busy, actionError, onClose }: {
  storageKey: string; defaults: Application; mutate: Mutate; busy: boolean; actionError?: string; onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => readDraft(storageKey, defaults));
  const [failed, setFailed] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  function update<K extends keyof Application>(key: K, value: Application[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setStorageUnavailable(false); }
    catch { setStorageUnavailable(true); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setFailed(false);
    const { name, location, category, operatingHours, product, price } = draft;
    if (await mutate("/api/shop/applications", {
      name: name.trim(), location: location.trim(), category: category.trim(), operatingHours: operatingHours.trim(),
      product: { name: product.trim(), price: Number(price) }, pin: draft.pin,
    })) {
      try { localStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
      onClose();
    } else setFailed(true);
  }
  return <Modal title="Sell a product" description="Submit your shop and first product for campus administrator review."
    busy={busy} onClose={onClose} error={failed ? actionError || "We couldn’t submit your application. Try again." : undefined}>
    <form onSubmit={submit}>
      {["Shop details", "First product"].map((title, index) => <fieldset className="profile-fieldset" key={title}>
        <legend>{title}</legend>
        <div className="form-grid">{(index === 0 ? fields.slice(0, 4) : fields.slice(4)).map(({ key, label, example }) =>
          <label key={key}>{label}<input required value={draft[key]} onChange={(e) => update(key, e.target.value)} placeholder={example}
            {...(key === "price" ? { type: "number", min: 1, max: 1000000, step: 1 } : { type: "text", minLength: 2, maxLength: 200 })} /></label>
        )}</div>
        {index === 0 && <PinPicker label="Stall pickup pin" value={draft.pin} onChange={(p) => update("pin", p)} />}
      </fieldset>)}
      {storageUnavailable && <p className="live-warning" role="status">Your browser couldn’t save this draft. Keep the form open to retain your entries.</p>}
      <div className="form-actions"><button type="button" className="secondary-button" onClick={onClose}>Close</button>
        <button className="primary-button" disabled={busy}>Submit application</button></div>
    </form>
  </Modal>;
}

function ProfileDetails({ profile, mutate, busy, actionError }: { profile: Profile; mutate: Mutate; busy: boolean; actionError?: string }) {
  const [edit, setEdit] = useState<{ name: string; phone: string } | null>(null);
  const [notice, setNotice] = useState<"saved" | "failed" | null>(null);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!edit || busy) return;
    const ok = await mutate("/api/customer/profile", { name: edit.name.trim(), phone: edit.phone.trim() || null }, "PATCH");
    setNotice(ok ? "saved" : "failed");
    if (ok) setEdit(null);
  }
  return <Panel>
    <div className="profile-heading"><span className="profile-icon"><UserRound aria-hidden="true" /></span>
      <div><h2>{profile.name}</h2><p><Mail size={14} aria-hidden="true" />{profile.email}</p></div>
    </div>
    {edit ? <form onSubmit={save}>
      <div className="form-grid">
        <label>Full name<input required minLength={2} maxLength={100} autoComplete="name" value={edit.name} disabled={busy}
          onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
        <label>Phone number (optional)<input type="tel" autoComplete="tel" maxLength={32} value={edit.phone} disabled={busy}
          onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></label>
      </div>
      {notice === "failed" && <p className="live-warning" role="alert">{actionError || "We couldn’t save your profile. Try again."}</p>}
      <div className="form-actions"><button className="secondary-button" type="button" disabled={busy} onClick={() => { setEdit(null); setNotice(null); }}>Cancel</button>
        <button className="primary-button" disabled={busy}>Save changes</button></div>
    </form> : <div className="profile-detail-row">
      <div><span>Phone number</span><strong>{profile.phone || "No phone number added"}</strong></div>
      <button type="button" className="secondary-button" onClick={() => { setEdit({ name: profile.name, phone: profile.phone ?? "" }); setNotice(null); }}>Edit profile</button>
    </div>}
    {notice === "saved" && <p className="profile-feedback" role="status">Profile updated.</p>}
  </Panel>;
}

export function CustomerProfile(props: Props) {
  return <CustomerAccount key={props.user.id} {...props} />;
}

function CustomerAccount({ data, user, mutate, busy, actionError }: Props) {
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [section, setSection] = useState("products");
  const shop = data.ownedShop;
  const approved = shop?.verification === "VERIFIED";
  const pending = shop?.verification === "PENDING";
  const rejected = shop?.verification === "REJECTED";
  const profile = data.profile ?? { name: user.name, email: user.email, phone: null };
  return <div className="workspace-stack customer-profile">
    <ProfileDetails profile={profile} mutate={mutate} busy={busy} actionError={actionError} />
    <Panel>
      <div className="profile-heading"><span className="profile-icon profile-store-icon"><Store aria-hidden="true" /></span>
        <div><h2>{shop ? shop.name : "Sell on campus"}</h2><p>{shop ? shop.location : "List your first product in the campus marketplace."}</p></div>
      </div>
      {shop && <div className="profile-review" data-state={shop.verification}>
        {approved ? <CheckCircle2 size={18} aria-hidden="true" /> : pending ? <Clock3 size={18} aria-hidden="true" /> : <Store size={18} aria-hidden="true" />}
        <div><strong>{approved ? "Approved" : pending ? "Pending review" : "Application rejected"}</strong>
          <p>{approved ? "Manage your products, orders and shop details." : pending ? "A campus administrator will review your shop before your products appear in the marketplace." : "Your shop application was declined. Contact a campus administrator for more details."}</p></div>
      </div>}
      {(!shop || rejected) && <button className="primary-button profile-action" onClick={() => setApplicationOpen(true)}><ShoppingBag size={17} />{rejected ? "Revise application" : "Sell a product"}</button>}
      {approved && <button className="secondary-button profile-action" aria-expanded={shopOpen} onClick={() => setShopOpen(!shopOpen)}>My shop</button>}
    </Panel>
    {approved && shopOpen && <section aria-label="My shop" className="profile-shop">
      <nav aria-label="Shop sections" className="filter-row">{[["products", "Products"], ["orders", "Orders"], ["settings", "Settings"]].map(([key, label]) =>
        <button type="button" key={key} aria-pressed={key === section} className={`chip-button ${key === section ? "selected" : ""}`} onClick={() => setSection(key)}>{label}</button>)}</nav>
      <SellerWorkspace data={{ ...data, shops: [shop], orders: data.sellerOrders ?? [] }} mutate={mutate} busy={busy} actionError={actionError}
        section={section} onSectionChange={setSection} />
    </section>}
    {applicationOpen && (!shop || rejected) && <ApplicationForm storageKey={`uniserve:shop-application:${user.id}`} defaults={shop ? {
      name: shop.name, category: shop.category, location: shop.location, operatingHours: shop.operatingHours,
      pin: mapPoint(shop.latitude, shop.longitude),
      product: shop.items[0]?.name ?? "", price: shop.items[0] ? String(shop.items[0].price) : "",
    } : emptyApplication}
      mutate={mutate} busy={busy} actionError={actionError} onClose={() => setApplicationOpen(false)} />}
  </div>;
}
