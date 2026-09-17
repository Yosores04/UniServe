import {
  Bike,
  CheckCircle2,
  Clock3,
  MessageCircle,
  PackageCheck,
} from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  acceptOrder,
  addOrderMessage,
  advanceOrderStatus,
  setCourierAvailability,
} from "../lib/demoState";
import {
  ActivityFeed,
  CampusMap,
  EmptyState,
  OrderCard,
  Panel,
  PanelHeader,
  PortalHero,
  PortalLayout,
  money,
} from "../components/DemoKit";
import type { DemoState, Order } from "../types";

export function CourierPortal({
  state,
  setState,
}: {
  state: DemoState;
  setState: Dispatch<SetStateAction<DemoState>>;
}) {
  const [jobFilter, setJobFilter] = useState<
    "All" | "Food" | "Printing" | "Errand"
  >("All");
  const courier = state.couriers[0];
  const completedOrders = state.orders.filter(
    (order) => order.courierId === courier.id && order.status === "Delivered",
  );
  const availableOrders = state.orders.filter(
    (order) =>
      order.status === "Pending" &&
      (jobFilter === "All" || order.serviceType === jobFilter),
  );
  const activeOrder = state.orders.find(
    (order) => order.courierId === courier.id && order.status !== "Delivered",
  );
  const mapOrder = activeOrder ?? state.orders[0];

  return (
    <>
      <PortalHero
        role="courier"
        stat={{
          label: "Today's earnings",
          value: money(courier.earningsToday),
        }}
        aside={`${courier.deliveriesToday} completed deliveries`}
      />
      <PortalLayout
        sidebar={
          <>
            <CampusMap state={state} highlightedOrder={mapOrder} />
            <ActivityFeed state={state} />
          </>
        }
      >
        <div className="dashboard-grid">
          <Panel className="span-5">
            <PanelHeader
              icon={Bike}
              eyebrow="Courier profile"
              title={courier.name}
            />
            <div className="courier-profile">
              <div className="avatar">{courier.avatar}</div>
              <div>
                <h3>{courier.name}</h3>
                <p>{courier.currentPoint}</p>
                <span>{courier.rating} rating</span>
                <span className="verified-label">Verified courier</span>
              </div>
            </div>
            <div className="availability-control">
              <div>
                <span
                  className={
                    courier.availability === "Online"
                      ? "status-dot online"
                      : "status-dot"
                  }
                />
                <strong>{courier.availability}</strong>
                <small>
                  {courier.availability === "Online"
                    ? "Available for service and delivery"
                    : "Not currently accepting requests"}
                </small>
              </div>
              <button
                className={
                  courier.availability === "Online"
                    ? "selected chip-button"
                    : "primary-button"
                }
                type="button"
                aria-pressed={courier.availability === "Online"}
                onClick={() =>
                  setState((current) =>
                    setCourierAvailability(
                      current,
                      courier.id,
                      courier.availability === "Online" ? "Offline" : "Online",
                    ),
                  )
                }
              >
                {courier.availability === "Online" ? "Go offline" : "Go online"}
              </button>
            </div>
            <div className="earnings-tile">
              <span>Courier earnings</span>
              <strong>{money(courier.earningsToday)}</strong>
            </div>
            <div className="history-list">
              <div className="section-label">Earnings history</div>
              <span>{completedOrders.length} completed deliveries</span>
              <strong>
                {money(completedOrders.length * 30)} earned from completed jobs
              </strong>
            </div>
          </Panel>

          <Panel className="span-7">
            <PanelHeader
              icon={PackageCheck}
              eyebrow="Active delivery"
              title={activeOrder?.id ?? "No active job"}
            />
            {activeOrder ? (
              <ActiveDelivery order={activeOrder} setState={setState} />
            ) : (
              <EmptyState text="You are ready for the next available campus request." />
            )}
          </Panel>

          <Panel className="span-12">
            <PanelHeader
              icon={Clock3}
              eyebrow="Job board"
              title={`${availableOrders.length} requests waiting`}
            />
            <div className="filter-row" aria-label="Filter available jobs">
              {(["All", "Food", "Printing", "Errand"] as const).map(
                (filter) => (
                  <button
                    className={
                      jobFilter === filter
                        ? "selected chip-button"
                        : "chip-button"
                    }
                    key={filter}
                    type="button"
                    onClick={() => setJobFilter(filter)}
                  >
                    {filter}
                  </button>
                ),
              )}
            </div>
            <div className="order-list">
              {availableOrders.map((order) => (
                <article className="queue-card" key={order.id}>
                  <OrderCard order={order} compact />
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={courier.availability === "Offline"}
                    title={
                      courier.availability === "Offline"
                        ? "Go online to accept service requests"
                        : "Accept this request"
                    }
                    onClick={() =>
                      setState((current) =>
                        acceptOrder(current, order.id, courier.id),
                      )
                    }
                  >
                    Accept
                  </button>
                </article>
              ))}
              {availableOrders.length === 0 && (
                <EmptyState text="All requests are currently assigned." />
              )}
            </div>
          </Panel>
        </div>
      </PortalLayout>
    </>
  );
}

function ActiveDelivery({
  order,
  setState,
}: {
  order: Order;
  setState: Dispatch<SetStateAction<DemoState>>;
}) {
  const [message, setMessage] = useState("");

  function sendMessage() {
    if (!message.trim()) return;
    setState((current) =>
      addOrderMessage(current, order.id, "Courier", message),
    );
    setMessage("");
  }

  return (
    <>
      <OrderCard order={order} />
      <div className="chat-box">
        <div className="section-label">
          <MessageCircle size={14} /> Customer / store chat
        </div>
        <div className="chat-messages">
          {(order.chat ?? []).slice(-3).map((item, index) => (
            <p key={`${item.createdAt}-${index}`}>
              <strong>{item.sender}</strong>
              {item.message}
            </p>
          ))}
        </div>
        <div className="chat-compose">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Send an update"
          />
          <button className="chip-button" type="button" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
      <button
        className="primary-button full"
        type="button"
        onClick={() =>
          setState((current) => advanceOrderStatus(current, order.id))
        }
      >
        <CheckCircle2 size={18} />
        Advance status
      </button>
    </>
  );
}
