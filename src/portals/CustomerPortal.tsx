import {
  CheckCircle2,
  Clock3,
  Coffee,
  PackageCheck,
  Printer,
  Store as StoreIcon,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { cancelOrder, placeOrder } from "../lib/demoState";
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
import type { DemoState, Order, ServiceType } from "../types";

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
  const customerOrders = props.state.orders.filter(
    (order) =>
      order.customerName === "Demo Customer" || order.id === "order-1001",
  );

  function submitDemoOrder() {
    const defaultItems: Record<ServiceType, string[]> = {
      Food: ["Chicken pastel", "Iced coffee"],
      Printing: ["Printed research paper"],
      Errand: ["Campus errand request"],
    };

    props.setState((current) =>
      placeOrder(current, {
        serviceType: props.serviceType,
        storeId: props.storeId,
        items: defaultItems[props.serviceType],
        pickupPoint: props.pickupPoint,
        dropoffPoint: props.dropoffPoint,
        customerNote: props.note,
      }),
    );
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
                <strong>Cash on Delivery</strong>
                <span>
                  Estimated service fee:{" "}
                  {props.serviceType === "Errand" ? "PHP 35" : "PHP 25"}
                </span>
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
          </Panel>

          <Panel className="span-5">
            <PanelHeader
              icon={Clock3}
              eyebrow="Order tracking"
              title={latestOrder.id}
            />
            <OrderCard order={latestOrder} />
            <Timeline status={latestOrder.status} />
            <div className="order-history">
              <div className="section-label">Recent requests</div>
              {customerOrders.slice(0, 4).map((order) => (
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
