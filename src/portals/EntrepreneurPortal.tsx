import { LayoutDashboard, PackageCheck, Store as StoreIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { setStoreOrderStatus } from "../lib/demoState";
import {
  ActivityFeed,
  AdminTile,
  CampusMap,
  EmptyState,
  OrderCard,
  Panel,
  PanelHeader,
  PortalHero,
  PortalLayout,
  money
} from "../components/DemoKit";
import type { DemoState, StoreOrderStatus } from "../types";

export function EntrepreneurPortal({
  state,
  setState
}: {
  state: DemoState;
  setState: Dispatch<SetStateAction<DemoState>>;
}) {
  const selectedStore = state.stores[0];
  const storeOrders = state.orders.filter((order) => order.storeId === selectedStore.id);
  const mapOrder = storeOrders[0] ?? state.orders[0];

  return (
    <>
      <PortalHero
        role="store"
        stat={{ label: "Sales today", value: money(selectedStore.salesToday) }}
        aside={`${storeOrders.length} orders in queue`}
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
            <PanelHeader icon={StoreIcon} eyebrow="Store profile" title={selectedStore.name} />
            <div className="store-summary">
              <h3>{selectedStore.category}</h3>
              <p>{selectedStore.location}</p>
              <div className="mini-metrics">
                <span>{money(selectedStore.salesToday)} sales</span>
                <span>{selectedStore.rating} rating</span>
                <span>{selectedStore.status}</span>
              </div>
            </div>
            <div className="product-stack">
              {selectedStore.featuredItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </Panel>

          <Panel className="span-7">
            <PanelHeader icon={PackageCheck} eyebrow="Order preparation" title="Counter queue" />
            <div className="order-list">
              {storeOrders.map((order) => (
                <article className="queue-card" key={order.id}>
                  <OrderCard order={order} compact />
                  <div className="status-actions">
                    {(["Preparing", "Ready for pickup", "Completed"] as StoreOrderStatus[]).map((status) => (
                      <button
                        className={order.storeStatus === status ? "selected chip-button" : "chip-button"}
                        key={status}
                        type="button"
                        onClick={() => setState((current) => setStoreOrderStatus(current, order.id, status))}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
              {storeOrders.length === 0 && <EmptyState text="No orders waiting for this store." />}
            </div>
          </Panel>

          <Panel className="span-12">
            <PanelHeader icon={LayoutDashboard} eyebrow="Sales dashboard" title="Campus entrepreneur snapshot" />
            <div className="admin-grid">
              {state.stores.map((store) => (
                <AdminTile key={store.id} icon={StoreIcon} label={store.name} value={money(store.salesToday)} />
              ))}
            </div>
          </Panel>
        </div>
      </PortalLayout>
    </>
  );
}
