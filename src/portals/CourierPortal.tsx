import { Bike, CheckCircle2, Clock3, PackageCheck } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  acceptOrder,
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
import type { CourierAvailability, DemoState, Order } from "../types";

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
              </div>
            </div>
            <div className="availability-row">
              {(["Available", "Busy", "Offline"] as CourierAvailability[]).map(
                (availability) => (
                  <button
                    className={
                      courier.availability === availability ? "selected" : ""
                    }
                    key={availability}
                    type="button"
                    onClick={() =>
                      setState((current) =>
                        setCourierAvailability(
                          current,
                          courier.id,
                          availability,
                        ),
                      )
                    }
                  >
                    {availability}
                  </button>
                ),
              )}
            </div>
            <div className="earnings-tile">
              <span>Courier earnings</span>
              <strong>{money(courier.earningsToday)}</strong>
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
  return (
    <>
      <OrderCard order={order} />
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
