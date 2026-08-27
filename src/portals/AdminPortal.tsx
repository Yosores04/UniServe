import {
  Bike,
  CreditCard,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Star,
  Store as StoreIcon,
} from "lucide-react";
import { useState } from "react";
import {
  AdminTile,
  ApplicationRow,
  CampusMap,
  ActivityFeed,
  OrderCard,
  Panel,
  PanelHeader,
  PortalHero,
  PortalLayout,
  money,
} from "../components/DemoKit";
import type { DemoState, Role } from "../types";

export function AdminPortal({
  state,
  setRole,
}: {
  state: DemoState;
  setRole: (role: Role) => void;
}) {
  const [orderFilter, setOrderFilter] = useState<
    "All" | "Pending" | "In progress"
  >("All");
  const [applications, setApplications] = useState([
    { label: "Courier applicant", name: "Arvin C.", status: "Interview" },
    {
      label: "Store applicant",
      name: "Bloom Bakes",
      status: "For permit review",
    },
    { label: "Courier ID", name: "Lia S.", status: "Approved" },
  ]);
  const visibleOrders = state.orders.filter((order) => {
    if (order.status === "Delivered") return false;
    if (orderFilter === "Pending") return order.status === "Pending";
    if (orderFilter === "In progress") return order.status !== "Pending";
    return true;
  });

  function updateApplication(name: string, status: string) {
    setApplications((current) =>
      current.map((application) =>
        application.name === name ? { ...application, status } : application,
      ),
    );
  }

  return (
    <>
      <PortalHero
        role="admin"
        stat={{
          label: "Active orders",
          value: state.stats.activeOrders.toString(),
        }}
        aside={`${state.stats.activeCouriers} couriers available now`}
      />
      <PortalLayout
        sidebar={
          <>
            <CampusMap state={state} highlightedOrder={state.orders[0]} />
            <ActivityFeed state={state} />
          </>
        }
      >
        <div className="dashboard-grid">
          <Panel className="span-12">
            <PanelHeader
              icon={ShieldCheck}
              eyebrow="Operations"
              title="Admin command center"
            />
            <div className="admin-grid">
              <AdminTile
                icon={Bike}
                label="Active couriers"
                value={state.stats.activeCouriers}
                onOpen={() => setRole("courier")}
              />
              <AdminTile
                icon={PackageCheck}
                label="Active orders"
                value={state.stats.activeOrders}
                onOpen={() => setRole("customer")}
              />
              <AdminTile
                icon={StoreIcon}
                label="Stores"
                value={state.stats.registeredStores}
                onOpen={() => setRole("store")}
              />
              <AdminTile
                icon={CreditCard}
                label="Fees collected"
                value={money(state.stats.totalRevenue)}
              />
              <AdminTile
                icon={MessageCircle}
                label="Complaints"
                value={state.stats.complaints}
              />
              <AdminTile
                icon={Star}
                label="Quality rating"
                value={`${state.stats.averageRating}/5`}
              />
            </div>
          </Panel>

          <Panel className="span-7">
            <PanelHeader
              icon={PackageCheck}
              eyebrow="Delivery monitoring"
              title="All active orders"
            />
            <div className="filter-row" aria-label="Filter active orders">
              {(["All", "Pending", "In progress"] as const).map((filter) => (
                <button
                  className={
                    orderFilter === filter
                      ? "selected chip-button"
                      : "chip-button"
                  }
                  key={filter}
                  type="button"
                  onClick={() => setOrderFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="order-list">
              {visibleOrders.map((order) => (
                <OrderCard key={order.id} order={order} compact />
              ))}
            </div>
          </Panel>

          <Panel className="span-5">
            <PanelHeader
              icon={ShieldCheck}
              eyebrow="Verification"
              title="Applications"
            />
            <div className="application-list">
              {applications.map((application) => (
                <ApplicationRow
                  key={application.name}
                  {...application}
                  onApprove={() =>
                    updateApplication(application.name, "Approved")
                  }
                  onReject={() =>
                    updateApplication(application.name, "Needs review")
                  }
                />
              ))}
            </div>
          </Panel>
        </div>
      </PortalLayout>
    </>
  );
}
