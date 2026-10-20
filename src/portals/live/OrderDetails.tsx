import { useId, useState } from "react";
import { ArrowUpRight, MapPin, MessageCircle, Package, Send, Star } from "lucide-react";
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
  const [score, setScore] = useState(String(order.rating?.score ?? 5));
  const [complaint, setComplaint] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [notice, setNotice] = useState("");
  const reportId = useId();
  const terminal = order.status === "DELIVERED" || order.status === "CANCELLED";
  const nextDelivery = ({ ACCEPTED: "PICKED_UP", PICKED_UP: "ON_THE_WAY", ON_THE_WAY: "DELIVERED" } as Record<string, string>)[order.status];
  const nextPreparation = ({ NEW: "PREPARING", PREPARING: "READY_FOR_PICKUP" } as Record<string, string>)[order.shopStatus];
  const mayChat = role === "customer" || (role === "courier" && order.status !== "PENDING");
  const tone = order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "danger" : order.status === "PENDING" ? "warning" : "info";
  const messages = order.chatThread?.messages ?? [];
  return <article className="live-order" aria-label={`Order ${order.id}`}>
    <div className="live-order-heading"><div><span className="eyebrow">{order.serviceType} / #{order.id.slice(-6).toUpperCase()}</span><h3>{order.shop?.name ?? "Campus order"}</h3></div><strong>{money(order.total)}</strong></div>
    <div className="live-badges"><span data-tone={tone}>{statusLabel(order.status)}</span><span>{statusLabel(order.shopStatus)}</span></div>
    <div className="order-route"><div className="route-stop"><Package size={15} /><div><small>Pick up from</small>{order.pickupPoint}</div></div><div className="route-stop"><MapPin size={15} /><div><small>Deliver to</small>{order.dropoffPoint}</div></div></div>
    {order.customer && role !== "customer" && <p>For {order.customer.name}</p>}
    <ul className="live-items">{order.items.map((item) => <li key={item.id}>{item.quantity} × {item.name}<span>{money(item.quantity * item.unitPrice)}</span></li>)}</ul>
    <div className="order-meta"><span>{money(order.deliveryFee)} delivery</span><span>{order.paymentMethod === "COD" ? "Cash on delivery" : "E-wallet · arranged separately"}</span><span>{new Date(order.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</span></div>
    {order.customerNote && <p className="live-note">{order.customerNote}</p>}
    <div className="row-actions">
      {role === "customer" && onReorder && <button type="button" className="secondary-button" onClick={() => onReorder(order)}>Order again<ArrowUpRight size={13} /></button>}
      {role === "customer" && order.status === "PENDING" && <button type="button" className="chip-button" onClick={() => void mutate(`/api/customer/orders/${order.id}/cancel`)}>Cancel order</button>}
      {role === "store" && !terminal && nextPreparation && <button type="button" className="primary-button" onClick={() => void mutate(`/api/shop/orders/${order.id}/status`, { status: nextPreparation }, "PATCH")}>{nextPreparation === "PREPARING" ? "Accept & prepare" : "Ready for pickup"}<ArrowUpRight size={13} /></button>}
      {role === "courier" && nextDelivery && <button type="button" className="primary-button" disabled={nextDelivery === "PICKED_UP" && order.shopStatus !== "READY_FOR_PICKUP"} onClick={() => void mutate(`/api/rider/deliveries/${order.id}/status`, { status: nextDelivery }, "PATCH")}>{nextDelivery === "PICKED_UP" ? "Confirm pickup" : nextDelivery === "ON_THE_WAY" ? "On the way" : "Mark delivered"}<ArrowUpRight size={13} /></button>}
    </div>
    {role === "courier" && order.status === "ACCEPTED" && order.shopStatus !== "READY_FOR_PICKUP" && <p className="live-muted">Waiting for the shop to finish preparing this order.</p>}
    {mayChat && <details className="order-conversation"><summary><MessageCircle size={14} />Order conversation{messages.length > 0 && <span className="message-count">{messages.length}</span>}</summary>
      <div className="chat-box"><div className="chat-messages" role="log" aria-label="Order messages">{messages.length ? messages.map((item) => <p key={item.id}><strong>{item.sender?.name ?? "Participant"}</strong>{item.content}</p>) : <p>No messages yet. Send an update here.</p>}</div>
        {!terminal && <form className="chat-compose" onSubmit={async (event) => {
          event.preventDefault();
          const path = role === "customer" ? `/api/customer/orders/${order.id}/messages` : `/api/rider/deliveries/${order.id}/messages`;
          if (message.trim() && await mutate(path, { content: message.trim() })) setMessage("");
        }}><input aria-label="Message" maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message…" required /><button className="secondary-button" aria-label="Send message"><Send size={14} /></button></form>}
      </div>
    </details>}
    {role === "customer" && order.status === "DELIVERED" && <form className="live-rating" onSubmit={async (event) => {
      event.preventDefault();
      if (await mutate(`/api/customer/orders/${order.id}/rating`, { score: Number(score) })) setNotice("Thank you. Your rating has been saved.");
    }}><label>How was your delivery?<select value={score} onChange={(event) => setScore(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5 stars</option>)}</select></label><button className="chip-button"><Star size={12} />{order.rating ? "Update" : "Save rating"}</button>{order.rating && <span>Rated {order.rating.score}/5</span>}</form>}
    {role === "customer" && <>
      <button type="button" className="live-text-button" aria-expanded={showReport} aria-controls={reportId} onClick={() => setShowReport(!showReport)}>Need help with this order?</button>
      <div id={reportId} hidden={!showReport}><form className="chat-compose" onSubmit={async (event) => {
        event.preventDefault();
        if (await mutate(`/api/customer/orders/${order.id}/complaint`, { subject: "Order assistance", detail: complaint.trim() })) { setComplaint(""); setShowReport(false); setNotice("Your report was sent to the service desk."); }
      }}><input aria-label="Problem details" required minLength={5} maxLength={1000} value={complaint} onChange={(event) => setComplaint(event.target.value)} placeholder="Tell us what happened" /><button className="chip-button">Send report</button></form></div>
    </>}
    {notice && <p className="order-feedback" role="status">{notice}</p>}
  </article>;
}
