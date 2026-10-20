import { useState } from "react";
import type { LiveOrder, Mutate } from "../../lib/workspace";
import type { Role } from "../../types";
import { money } from "../../components/DemoKit";

export function statusLabel(value: string) {
  return value.toLowerCase().split("_").join(" ").replace(/^./, (letter) => letter.toUpperCase());
}

export function OrderDetails({ order, role, mutate, onReorder }: {
  order: LiveOrder; role: Role; mutate: Mutate; onReorder?: (order: LiveOrder) => void;
}) {
  const [message, setMessage] = useState("");
  const [score, setScore] = useState("5");
  const [complaint, setComplaint] = useState("");
  const [showReport, setShowReport] = useState(false);
  const terminal = order.status === "DELIVERED" || order.status === "CANCELLED";
  const nextDelivery = ({ ACCEPTED: "PICKED_UP", PICKED_UP: "ON_THE_WAY", ON_THE_WAY: "DELIVERED" } as Record<string, string>)[order.status];
  const nextPreparation = ({ NEW: "PREPARING", PREPARING: "READY_FOR_PICKUP" } as Record<string, string>)[order.shopStatus];
  const mayChat = role === "customer" || (role === "courier" && order.status !== "PENDING");

  return <article className="live-order">
    <div className="live-order-heading">
      <div><span className="eyebrow">{order.serviceType} · {order.id.slice(-8)}</span><h3>{order.shop?.name ?? "Campus order"}</h3></div>
      <strong>{money(order.total)}</strong>
    </div>
    <div className="live-badges"><span>{statusLabel(order.status)}</span><span>Shop: {statusLabel(order.shopStatus)}</span><span>{order.paymentMethod === "COD" ? "Cash on delivery" : "E-wallet · payment arranged separately"}</span></div>
    <p>{order.pickupPoint} → {order.dropoffPoint}</p>
    {order.customer && role !== "customer" && <p>Customer: {order.customer.name}</p>}
    <ul className="live-items">{order.items.map((item) => <li key={item.id}>{item.quantity} × {item.name}<span>{money(item.quantity * item.unitPrice)}</span></li>)}</ul>
    <p className="live-muted">Delivery fee {money(order.deliveryFee)} · {new Date(order.createdAt).toLocaleString("en-PH")}</p>
    {order.customerNote && <p className="live-note">{order.customerNote}</p>}
    <div className="row-actions">
      {role === "customer" && order.status === "PENDING" && <button className="chip-button" onClick={() => void mutate(`/api/customer/orders/${order.id}/cancel`)}>Cancel order</button>}
      {role === "customer" && onReorder && <button className="chip-button" onClick={() => onReorder(order)}>Order again</button>}
      {role === "store" && !terminal && nextPreparation && <button className="secondary-button" onClick={() => void mutate(`/api/shop/orders/${order.id}/status`, { status: nextPreparation }, "PATCH")}>{nextPreparation === "PREPARING" ? "Accept & prepare" : "Ready for pickup"}</button>}
      {role === "courier" && nextDelivery && <button className="primary-button" disabled={nextDelivery === "PICKED_UP" && order.shopStatus !== "READY_FOR_PICKUP"} onClick={() => void mutate(`/api/rider/deliveries/${order.id}/status`, { status: nextDelivery }, "PATCH")}>{nextDelivery === "PICKED_UP" ? "Confirm pickup" : nextDelivery === "ON_THE_WAY" ? "On the way" : "Mark delivered"}</button>}
    </div>
    {role === "courier" && order.status === "ACCEPTED" && order.shopStatus !== "READY_FOR_PICKUP" && <p className="live-muted">Waiting for the shop to mark this order ready.</p>}
    {mayChat && <div className="chat-box">
      <div className="section-label">Order conversation</div>
      <div className="chat-messages" role="log" aria-label="Order messages">{order.chatThread?.messages.length ? order.chatThread.messages.map((item) => <p key={item.id}><strong>{item.sender?.name ?? "Participant"}</strong>{item.content}</p>) : <p>No messages yet.</p>}</div>
      {!terminal && <form className="chat-compose" onSubmit={async (event) => {
        event.preventDefault();
        const path = role === "customer" ? `/api/customer/orders/${order.id}/messages` : `/api/rider/deliveries/${order.id}/messages`;
        if (message.trim() && await mutate(path, { content: message.trim() })) setMessage("");
      }}><input aria-label="Message" maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Send an update" required /><button className="chip-button">Send</button></form>}
    </div>}
    {role === "customer" && order.status === "DELIVERED" && <form className="live-rating" onSubmit={async (event) => { event.preventDefault(); await mutate(`/api/customer/orders/${order.id}/rating`, { score: Number(score) }); }}>
      <label>Rate delivery<select value={score} onChange={(event) => setScore(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label>
      <button className="chip-button">{order.rating ? "Update rating" : "Save rating"}</button>{order.rating && <span>Saved: {order.rating.score}/5</span>}
    </form>}
    {role === "customer" && <>
      <button className="live-text-button" aria-expanded={showReport} onClick={() => setShowReport(!showReport)}>Report a problem</button>
      {showReport && <form className="chat-compose" onSubmit={async (event) => {
        event.preventDefault();
        if (await mutate(`/api/customer/orders/${order.id}/complaint`, { subject: "Order assistance", detail: complaint.trim() })) { setComplaint(""); setShowReport(false); }
      }}><input aria-label="Problem details" required minLength={5} maxLength={1000} value={complaint} onChange={(event) => setComplaint(event.target.value)} placeholder="Describe the problem" /><button className="chip-button">Submit report</button></form>}
    </>}
  </article>;
}
