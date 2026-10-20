import { useState } from "react";
import { Bike, PackageCheck } from "lucide-react";
import { EmptyState, Panel, PanelHeader, money } from "../../components/DemoKit";
import type { Mutate, Workspace } from "../../lib/workspace";
import { OrderDetails } from "./OrderDetails";

export function RiderWorkspace({ data, mutate, section, onSectionChange, busy = false }: { data: Workspace; mutate: Mutate; section: string; onSectionChange: (section: string) => void; busy?: boolean; actionError?: string }) {
  const [filter, setFilter] = useState("All");
  const rider = data.rider;
  if (!rider) return <Panel><EmptyState text="Your courier profile is unavailable. Contact an administrator." /></Panel>;
  const assigned = data.orders.filter((order) => order.riderId === rider.id);
  const active = assigned.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
  const history = assigned.filter((order) => ["DELIVERED", "CANCELLED"].includes(order.status));
  const jobs = data.orders.filter((order) => order.status === "PENDING" && !order.riderId && (filter === "All" || filter === order.serviceType));
  return <div className="workspace-stack">
    <div hidden={section !== "jobs"}><Panel>
      <div className="toggle-card"><div><strong>{rider.user?.name ?? "My courier workspace"}</strong><p className="section-description">{rider.verified ? "Verified courier" : "Awaiting administrator verification"} · <span className="badge" data-tone={rider.availability === "ONLINE" ? "success" : "neutral"}>{rider.availability === "ONLINE" ? "Online" : "Offline"}</span></p></div><button type="button" className="primary-button" disabled={busy || !rider.verified} onClick={() => void mutate("/api/rider/availability", { availability: rider.availability === "ONLINE" ? "OFFLINE" : "ONLINE" }, "PATCH")}>{rider.availability === "ONLINE" ? "Go offline" : "Go online"}</button></div>
      {!rider.verified && <p className="live-warning">An administrator must verify your account before you can accept deliveries.</p>}
      {rider.verified && rider.availability !== "ONLINE" && <p className="section-description">Go online when you are ready to accept a delivery.</p>}
    </Panel></div>
    <div hidden={section !== "deliveries"}><Panel><div className="section-toolbar"><PanelHeader icon={PackageCheck} eyebrow="Assigned to you" title="My deliveries" /><button type="button" className="secondary-button" onClick={() => onSectionChange("jobs")}>Find a delivery</button></div><p className="section-description">Update each delivery as you collect and deliver the order.</p><div className="live-order-grid">{active.map((order) => <OrderDetails key={order.id} order={order} role="courier" mutate={mutate} />)}</div>{!active.length && <EmptyState text="No active deliveries. Accept a request from the job board." />}</Panel>
      </div><div hidden={section !== "history"}><Panel><PanelHeader icon={PackageCheck} eyebrow="Past work" title="Delivery history" /><div className="live-order-grid">{history.map((order) => <OrderDetails key={order.id} order={order} role="courier" mutate={mutate} />)}</div>{!history.length && <EmptyState text="Completed and cancelled deliveries will appear here." />}</Panel>
      </div><div hidden={section !== "jobs"}><Panel><PanelHeader icon={Bike} eyebrow="Campus job board" title="Available deliveries" /><p className="section-description">Choose a request that fits your route around campus.</p>
        <div className="filter-row">{["All", "Food", "Printing", "Errand", "Marketplace"].map((value) => <button type="button" key={value} aria-pressed={filter === value} className={`chip-button ${filter === value ? "selected" : ""}`} onClick={() => setFilter(value)}>{value}</button>)}</div>
        <div className="live-order-grid">{jobs.map((order) => <div className="workspace-stack" key={order.id}><OrderDetails order={order} role="courier" mutate={mutate} /><button type="button" className="primary-button full" disabled={busy || !rider.verified || rider.availability !== "ONLINE"} onClick={() => void mutate(`/api/rider/jobs/${order.id}/accept`)}>Accept delivery · {money(order.deliveryFee)} fee</button></div>)}</div>
        {!jobs.length && <EmptyState text="No available requests in this view. New requests appear automatically." />}
      </Panel></div>
  </div>;
}
