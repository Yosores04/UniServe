import { useState } from "react";
import { Bike, PackageCheck } from "lucide-react";
import { EmptyState, Panel, PanelHeader, money } from "../../components/DemoKit";
import type { Mutate, Workspace } from "../../lib/workspace";
import { OrderDetails } from "./OrderDetails";

export function RiderWorkspace({ data, mutate }: { data: Workspace; mutate: Mutate }) {
  const [filter, setFilter] = useState("All");
  const rider = data.rider;
  if (!rider) return <EmptyState text="Your courier profile is unavailable. Contact an administrator." />;
  const assigned = data.orders.filter((order) => order.riderId === rider.id);
  const active = assigned.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
  const jobs = data.orders.filter((order) => order.status === "PENDING" && !order.riderId && (filter === "All" || filter === order.serviceType));
  return <div className="dashboard-grid">
    <Panel className="span-5"><PanelHeader icon={Bike} eyebrow="Courier profile" title={rider.user?.name ?? "My courier workspace"} />
      <div className="live-badges"><span>{rider.verified ? "Verified courier" : "Awaiting admin verification"}</span><span>{rider.availability === "ONLINE" ? "Online" : "Offline"}</span></div>
      {!rider.verified && <p className="live-warning">An administrator must verify your account before you can accept deliveries.</p>}
      <div className="earnings-tile"><span>Delivery earnings today</span><strong>{money(rider.earningsToday)}</strong></div>
      <p>{rider.deliveriesToday} completed deliveries today</p>
      <button className="primary-button" disabled={!rider.verified} onClick={() => void mutate("/api/rider/availability", { availability: rider.availability === "ONLINE" ? "OFFLINE" : "ONLINE" }, "PATCH")}>{rider.availability === "ONLINE" ? "Go offline" : "Go online"}</button>
    </Panel>
    <Panel className="span-7"><PanelHeader icon={PackageCheck} eyebrow="Assigned to you" title="Active deliveries" /><div className="order-list">{active.map((order) => <OrderDetails key={order.id} order={order} role="courier" mutate={mutate} />)}</div>{!active.length && <EmptyState text="No active deliveries. Accept a request from the job board." />}</Panel>
    <Panel className="span-12"><PanelHeader icon={Bike} eyebrow="Available requests" title="Campus job board" />
      <div className="filter-row">{["All", "Food", "Printing", "Errand", "Marketplace"].map((value) => <button key={value} className={`chip-button ${filter === value ? "selected" : ""}`} onClick={() => setFilter(value)}>{value}</button>)}</div>
      <div className="live-order-grid">{jobs.map((order) => <div key={order.id}><OrderDetails order={order} role="courier" mutate={mutate} /><button className="secondary-button full" disabled={!rider.verified || rider.availability !== "ONLINE"} onClick={() => void mutate(`/api/rider/jobs/${order.id}/accept`)}>Accept delivery · {money(order.deliveryFee)} fee</button></div>)}</div>
      {!jobs.length && <EmptyState text="No available requests in this view. New requests appear automatically." />}
    </Panel>
    <Panel className="span-12"><PanelHeader icon={PackageCheck} eyebrow="Completed work" title="Delivery history" /><div className="live-order-grid">{assigned.filter((order) => order.status === "DELIVERED").map((order) => <OrderDetails key={order.id} order={order} role="courier" mutate={mutate} />)}</div>{!assigned.some((order) => order.status === "DELIVERED") && <EmptyState text="Completed deliveries will appear here." />}</Panel>
  </div>;
}
