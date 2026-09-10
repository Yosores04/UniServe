import {
  CheckCircle2,
  Clock3,
  Coffee,
  MessageCircle,
  PackageCheck,
  Printer,
  Store as StoreIcon,
} from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  addOrderMessage,
  cancelOrder,
  placeOrder,
  rateOrder,
  setPaymentMethod,
} from "../lib/demoState";
import {
  CampusMap,
  ActivityFeed,
  OrderCard,
  Panel,
  PanelHeader,
  PortalHero,
  PortalLayout,
  StoreTile,
  Timeline,
} from "../components/DemoKit";
import type { DemoState, Order, PaymentMethod, ServiceType } from "../types";

type CustomerPortalProps = {
  state: DemoState;
  setState: Dispatch<SetStateAction<DemoState>>;
  serviceType: ServiceType;
  setServiceType: (serviceType: ServiceType) => void;
  storeId: string;
  setStoreId: (storeId: string) => void;
  pickupPoint: string;
  setPickupPoint: (point: string) => void;
  dropoffPoint: string;
  setDropoffPoint: (point: string) => void;
  note: string;
  setNote: (note: string) => void;
};

export function CustomerPortal(props: CustomerPortalProps) {
  const campusNames = props.state.campusPoints.map((point) => point.name);
  const latestOrder = props.state.orders[0];
  const [paymentMethod, setPayment] = useState<PaymentMethod>("COD");
  const [historyFilter, setHistoryFilter] = useState<
    "All" | "Active" | "Completed"
  >("All");
  const [message, setMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const customerOrders = props.state.orders.filter(
    (order) =>
      order.customerName === "Demo Customer" || order.id === "order-1001",
  );
  const visibleOrders = customerOrders.filter(
    (order) =>
      historyFilter === "All" ||
      (historyFilter === "Active"
        ? order.status !== "Delivered"
        : order.status === "Delivered"),
  );

  function submitDemoOrder() {
    if (props.pickupPoint === props.dropoffPoint) {
      setRequestError("Choose different pickup and drop-off locations.");
      return;
    }
    setRequestError("");
    const defaultItems: Record<ServiceType, string[]> = {
      Food: ["Chicken pastel", "Iced coffee"],
      Printing: ["Printed research paper"],
      Errand: ["Campus errand request"],
    };

    props.setState((current) => {
      const placed = placeOrder(current, {
        serviceType: props.serviceType,
        storeId: props.storeId,
        items: defaultItems[props.serviceType],
        pickupPoint: props.pickupPoint,
        dropoffPoint: props.dropoffPoint,
        customerNote: props.note,
      });
      return setPaymentMethod(placed, placed.orders[0].id, paymentMethod);
    });
  }

  function sendMessage() {
    if (!message.trim()) return;
    props.setState((current) =>
      addOrderMessage(current, latestOrder.id, "Customer", message),
    );
    setMessage("");
  }

  function selectStore(storeId: string) {
    const store = props.state.stores.find(
      (candidate) => candidate.id === storeId,
    );
    if (!store) return;
    props.setStoreId(store.id);
    props.setPickupPoint(store.location);
    props.setServiceType(store.id === "print-hub" ? "Printing" : "Food");
  }

  function reorder(order: Order) {
    props.setStoreId(order.storeId);
    props.setServiceType(order.serviceType);
    props.setPickupPoint(order.pickupPoint);
    props.setDropoffPoint(order.dropoffPoint);
    props.setNote(order.customerNote);
  }

  return (
    <>
      <PortalHero
        role="customer"
        stat={{ label: "Latest request", value: latestOrder.status }}
        aside={`${latestOrder.etaMinutes} min ETA from ${latestOrder.pickupPoint}`}
      />
      <PortalLayout
        sidebar={
          <>
            <CampusMap state={props.state} highlightedOrder={latestOrder} />
            <ActivityFeed state={props.state} />
          </>
        }
      >
        <div className="dashboard-grid">
          <Panel className="span-7">
            <PanelHeader
              icon={PackageCheck}
              eyebrow="Student request"
              title="Create delivery request"
            />
            <ServicePicker
              serviceType={props.serviceType}
              setServiceType={props.setServiceType}
            />
            <div className="form-grid">
              <label>
                Store or service
                <select
                  value={props.storeId}
                  onChange={(event) => props.setStoreId(event.target.value)}
                >
                  {props.state.stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Pickup point
                <select
                  value={props.pickupPoint}
                  onChange={(event) => props.setPickupPoint(event.target.value)}
                >
                  {campusNames.map((point) => (
                    <option key={point}>{point}</option>
                  ))}
                </select>
              </label>
              <label>
                Drop-off point
                <select
                  value={props.dropoffPoint}
                  onChange={(event) =>
                    props.setDropoffPoint(event.target.value)
                  }
                >
                  {campusNames.map((point) => (
                    <option key={point}>{point}</option>
                  ))}
                </select>
              </label>
              <label className="wide">
                Delivery note
                <textarea
                  value={props.note}
                  onChange={(event) => props.setNote(event.target.value)}
                />
              </label>
            </div>
            <div className="checkout-bar">
              <div>
                <strong>
                  {paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : "UniServe E-wallet"}
                </strong>
                <span>
                  Estimated service fee:{" "}
                  {props.serviceType === "Errand" ? "PHP 35" : "PHP 25"}
                </span>
              </div>
              <div className="payment-picker">
                {(["COD", "E-wallet"] as PaymentMethod[]).map((method) => (
                  <button
                    className={
                      paymentMethod === method
                        ? "selected chip-button"
                        : "chip-button"
                    }
                    type="button"
                    key={method}
                    onClick={() => setPayment(method)}
                  >
                    {method}
                  </button>
                ))}
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={submitDemoOrder}
              >
                <CheckCircle2 size={18} />
                Place order
              </button>
            </div>
            {requestError && (
              <p className="form-error" role="alert">
                {requestError}
              </p>
            )}
          </Panel>

          <Panel className="span-5">
            <PanelHeader
              icon={Clock3}
              eyebrow="Order tracking"
              title={latestOrder.id}
            />
            <OrderCard order={latestOrder} />
            <Timeline status={latestOrder.status} />
            <div className="chat-box">
              <div className="section-label">
                <MessageCircle size={14} /> Courier chat
              </div>
              <div className="chat-messages">
                {(latestOrder.chat ?? []).slice(-3).map((item, index) => (
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
                  placeholder="Write a message"
                />
                <button
                  className="chip-button"
                  type="button"
                  onClick={sendMessage}
                >
                  Send
                </button>
              </div>
            </div>
            <div className="order-history">
              <div className="section-label">Recent requests</div>
              <div className="filter-row">
                {(["All", "Active", "Completed"] as const).map((filter) => (
                  <button
                    className={
                      historyFilter === filter
                        ? "selected chip-button"
                        : "chip-button"
                    }
                    type="button"
                    key={filter}
                    onClick={() => setHistoryFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              {visibleOrders.slice(0, 4).map((order) => (
                <div className="history-row" key={order.id}>
                  <span>
                    <strong>{order.id}</strong>
                    {order.storeName}
                  </span>
                  <div className="row-actions">
                    <button
                      className="chip-button"
                      type="button"
                      onClick={() => reorder(order)}
                    >
                      Reorder
                    </button>
                    {order.status === "Pending" && (
                      <button
                        className="chip-button"
                        type="button"
                        onClick={() =>
                          props.setState((current) =>
                            cancelOrder(current, order.id),
                          )
                        }
                      >
                        Cancel
                      </button>
                    )}
                    {order.status === "Delivered" && (
                      <div className="rating-actions">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            className={
                              order.rating === rating
                                ? "selected chip-button"
                                : "chip-button"
                            }
                            type="button"
                            key={rating}
                            onClick={() =>
                              props.setState((current) =>
                                rateOrder(current, order.id, rating),
                              )
                            }
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="span-12">
            <PanelHeader
              icon={StoreIcon}
              eyebrow="Marketplace"
              title="Campus services open now"
            />
            <div className="store-row">
              {props.state.stores.map((store) => (
                <StoreTile
                  key={store.id}
                  store={store}
                  onSelect={() => selectStore(store.id)}
                />
              ))}
            </div>
          </Panel>
        </div>
      </PortalLayout>
    </>
  );
}

function ServicePicker({
  serviceType,
  setServiceType,
}: {
  serviceType: ServiceType;
  setServiceType: (serviceType: ServiceType) => void;
}) {
  return (
    <div className="segmented">
      {(["Food", "Printing", "Errand"] as ServiceType[]).map((type) => (
        <button
          className={serviceType === type ? "selected" : ""}
          key={type}
          type="button"
          onClick={() => setServiceType(type)}
        >
          {type === "Food" && <Coffee size={17} />}
          {type === "Printing" && <Printer size={17} />}
          {type === "Errand" && <PackageCheck size={17} />}
          {type}
        </button>
      ))}
    </div>
  );
}
