import { useMemo, type ElementType, type ReactNode } from "react";
import {
  Bike,
  Building2,
  Coffee,
  CreditCard,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  PackageCheck,
  Printer,
  ShieldCheck,
  Star,
  Store as StoreIcon,
  UserRound,
  WalletCards,
} from "lucide-react";
import { getPortalConfig, portalConfigs } from "../lib/portalConfig";
import type { DemoState, Order, OrderStatus, Role } from "../types";

const portalIcons: Record<Role, ElementType> = {
  customer: UserRound,
  courier: Bike,
  store: StoreIcon,
  admin: ShieldCheck,
};

const statusLabels: OrderStatus[] = [
  "Pending",
  "Accepted",
  "Picked up",
  "On the way",
  "Delivered",
];

export function money(value: number) {
  return `PHP ${value.toLocaleString("en-PH")}`;
}

export function UniversityHeader({
  activeRole,
  setRole,
  onReset,
  userName,
  onLogout,
}: {
  activeRole: Role;
  setRole: (role: Role) => void;
  onReset: () => void;
  userName?: string;
  onLogout?: () => void;
}) {
  return (
    <header className="university-header">
      <div className="brand-strip">
        <div className="buksu-mark" aria-hidden="true">
          <span>U</span>
          <i />
        </div>
        <div>
          <strong>UniServe</strong>
          <span>Campus delivery, errands, and marketplace services</span>
        </div>
      </div>
      <nav className="buksu-nav" aria-label="UniServe portals">
        {(() => {
          const portal = portalConfigs.find((candidate) => candidate.role === activeRole) ?? portalConfigs[0];
          const Icon = portalIcons[portal.role];
          return <span className="active-portal"><Icon size={17} /><span>{portal.label}</span></span>;
        })()}
        <button className="reset-button" type="button" onClick={onReset}>
          Reset Demo
        </button>
        {userName && onLogout && (
          <button className="logout-button" type="button" onClick={onLogout}>
            {userName} · Log out
          </button>
        )}
      </nav>
    </header>
  );
}

export function PortalHero({
  role,
  stat,
  aside,
}: {
  role: Role;
  stat: { label: string; value: string };
  aside: string;
}) {
  const config = getPortalConfig(role);
  const Icon = portalIcons[role];

  return (
    <section className={`portal-hero ${role}`}>
      <div>
        <p className="eyebrow">{config.audience}</p>
        <h1>{config.title}</h1>
        <p>{config.subtitle}</p>
        <span className="hero-action">{config.primaryAction}</span>
      </div>
      <aside>
        <Icon size={26} />
        <strong>{stat.value}</strong>
        <span>{stat.label}</span>
        <em>{aside}</em>
      </aside>
    </section>
  );
}

export function MetricStrip({ state }: { state: DemoState }) {
  return (
    <section className="metric-strip" aria-label="Live platform metrics">
      <Metric
        icon={Bike}
        label="Available couriers"
        value={state.stats.activeCouriers.toString()}
      />
      <Metric
        icon={PackageCheck}
        label="Active orders"
        value={state.stats.activeOrders.toString()}
      />
      <Metric
        icon={WalletCards}
        label="Delivery fees"
        value={money(state.stats.totalRevenue)}
      />
      <Metric
        icon={Star}
        label="Average rating"
        value={`${state.stats.averageRating}/5`}
      />
    </section>
  );
}

export function PortalLayout({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <section className="portal-layout">
      <div className="portal-main">{children}</div>
      <aside className="portal-sidebar">{sidebar}</aside>
    </section>
  );
}

export function PanelHeader({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: ElementType;
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="panel-header">
      <div className="panel-icon">
        <Icon size={18} />
      </div>
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
    </header>
  );
}

export function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <article className="metric">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function OrderCard({
  order,
  compact = false,
}: {
  order: Order;
  compact?: boolean;
}) {
  return (
    <article className={compact ? "order-card compact" : "order-card"}>
      <div className="order-topline">
        <span className={`service-badge ${order.serviceType.toLowerCase()}`}>
          {order.serviceType}
        </span>
        <strong>{order.status}</strong>
      </div>
      <h3>{order.storeName}</h3>
      <p>{order.items.join(", ")}</p>
      <div className="route">
        <MapPin size={15} />
        <span>
          {order.pickupPoint} {"->"} {order.dropoffPoint}
        </span>
      </div>
      {!compact && <p className="note">{order.customerNote}</p>}
      <div className="order-meta">
        <span>{money(order.total)}</span>
        <span>{order.etaMinutes} min ETA</span>
        <span>{order.paymentMethod}</span>
      </div>
    </article>
  );
}

export function Timeline({ status }: { status: OrderStatus }) {
  const activeIndex = statusLabels.indexOf(status);
  return (
    <div className="timeline">
      {statusLabels.map((label, index) => (
        <div className={index <= activeIndex ? "done" : ""} key={label}>
          <i />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function StoreTile({
  store,
  onSelect,
}: {
  store: DemoState["stores"][number];
  onSelect?: () => void;
}) {
  return (
    <button className="store-card" type="button" onClick={onSelect}>
      <div className="store-icon">
        {store.id === "print-hub" ? (
          <Printer size={22} />
        ) : store.id === "canteen-express" ? (
          <Coffee size={22} />
        ) : (
          <Building2 size={22} />
        )}
      </div>
      <div>
        <h3>{store.name}</h3>
        <p>{store.category}</p>
        <span>{store.location}</span>
      </div>
      <strong>{store.rating}</strong>
    </button>
  );
}

export function CampusMap({
  state,
  highlightedOrder,
}: {
  state: DemoState;
  highlightedOrder: Order;
}) {
  const routePoints = useMemo(
    () =>
      new Set([highlightedOrder.pickupPoint, highlightedOrder.dropoffPoint]),
    [highlightedOrder.dropoffPoint, highlightedOrder.pickupPoint],
  );

  return (
    <Panel className="map-panel">
      <PanelHeader
        icon={MapPin}
        eyebrow="Campus map"
        title={`${highlightedOrder.pickupPoint} to ${highlightedOrder.dropoffPoint}`}
      />
      <div className="campus-map">
        <div className="route-line" />
        {state.campusPoints.map((point) => (
          <button
            className={
              routePoints.has(point.name) ? "map-point active" : "map-point"
            }
            key={point.id}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            type="button"
            aria-label={point.name}
          >
            <span />
            <em>{point.name}</em>
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function ActivityFeed({ state }: { state: DemoState }) {
  return (
    <Panel className="activity-panel">
      <PanelHeader
        icon={MessageCircle}
        eyebrow="Updates"
        title="Live activity"
      />
      <div className="activity-feed">
        {state.activity.slice(0, 5).map((item, index) => (
          <div key={`${item}-${index}`}>
            <i />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="chat-preview">
        <strong>Customer chat</strong>
        <p>Courier: I am heading to your drop-off point now.</p>
      </div>
    </Panel>
  );
}

export function AdminTile({
  icon: Icon,
  label,
  value,
  onOpen,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  onOpen?: () => void;
}) {
  return (
    <button className="admin-tile" type="button" onClick={onOpen}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

export function ApplicationRow({
  label,
  name,
  status,
  onApprove,
  onReject,
}: {
  label: string;
  name: string;
  status: string;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  return (
    <div className="application-row">
      <span>{label}</span>
      <strong>{name}</strong>
      <em>{status}</em>
      {onApprove && (
        <div className="row-actions">
          <button className="chip-button" type="button" onClick={onApprove}>
            Approve
          </button>
          <button className="chip-button" type="button" onClick={onReject}>
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

export const demoIcons = {
  Bike,
  Coffee,
  CreditCard,
  LayoutDashboard,
  MessageCircle,
  PackageCheck,
  Printer,
  ShieldCheck,
  ShoppingBag: PackageCheck,
  Star,
  StoreIcon,
  UserRound,
};
