import { useEffect, useState, type ElementType } from "react";
import { ArrowDownLeft, CheckCheck, CircleDollarSign, Package, ShieldCheck, ShoppingBag, Sparkles, Star, Store, TrendingUp, Users } from "lucide-react";
import { money } from "./components/DemoKit";
import { WorkspaceShell } from "./components/workspace/WorkspaceShell";
import { AuthScreen } from "./components/AuthScreen";
import type { AuthUser } from "./lib/auth";
import { getCurrentUser, logoutFromApi } from "./lib/authClient";
import { ApiError } from "./lib/apiClient";
import { rolePath } from "./app/router";
import { useWorkspace, type Workspace } from "./lib/workspace";
import { resolveWorkspaceSection } from "./lib/workspaceNavigation";
import { Marketplace } from "./portals/live/Marketplace";
import { SellerWorkspace } from "./portals/live/SellerWorkspace";
import { RiderWorkspace } from "./portals/live/RiderWorkspace";
import { AdminWorkspace } from "./portals/live/AdminWorkspace";

function Metrics({ user, data }: { user: AuthUser; data: Workspace }) {
  const active = data.orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
  const delivered = data.orders.filter((order) => order.status === "DELIVERED");
  const shop = data.shops[0];
  const metrics: { label: string; value: string | number; detail: string; icon: ElementType; tone?: string }[] = user.role === "store" ? [
    { label: "Sales today", value: money(shop?.salesToday ?? 0), detail: "From completed deliveries", icon: TrendingUp, tone: "gold" },
    { label: "Active orders", value: active.length, detail: "A little preparation goes a long way", icon: Package },
    { label: "Available products", value: shop?.items.filter((item) => item.available).length ?? 0, detail: `${shop?.items.length ?? 0} products in your catalog`, icon: ShoppingBag },
    { label: "Customer rating", value: shop?.rating ? `${shop.rating.toFixed(1)} / 5` : "—", detail: shop?.rating ? "From delivered orders" : "Your first review is on its way", icon: Star },
  ] : user.role === "courier" ? [
    { label: "Earnings today", value: money(data.rider?.earningsToday ?? 0), detail: "Every completed delivery counts", icon: CircleDollarSign, tone: "gold" },
    { label: "Your active deliveries", value: active.filter((order) => order.riderId === data.rider?.id).length, detail: "Ready for your next move", icon: Package },
    { label: "Available requests", value: data.orders.filter((order) => order.status === "PENDING" && !order.riderId).length, detail: "Around your campus", icon: ArrowDownLeft },
    { label: "Completed today", value: data.rider?.deliveriesToday ?? 0, detail: "Delivered with a little care", icon: CheckCheck },
  ] : user.role === "admin" ? [
    { label: "Active orders", value: active.length, detail: "Across all campus services", icon: Package },
    { label: "Open shops", value: data.shops.filter((item) => item.open && item.verification === "VERIFIED").length, detail: `${data.shops.length} registered campus businesses`, icon: Store },
    { label: "Pending approvals", value: data.shops.filter((item) => item.verification === "PENDING").length + data.riders.filter((item) => !item.verified).length, detail: "New partners waiting to join", icon: ShieldCheck, tone: "gold" },
    { label: "Community members", value: data.users.length, detail: "The people making it happen", icon: Users },
  ] : [
    { label: "On the way to you", value: active.length, detail: "Your active campus requests", icon: Package, tone: "gold" },
    { label: "Open campus shops", value: data.shops.filter((item) => item.open).length, detail: "Something good is nearby", icon: Store },
    { label: "Orders delivered", value: delivered.length, detail: "Little errands, taken care of", icon: CheckCheck },
    { label: "Campus services", value: "4 ways", detail: "Food, printing, errands & more", icon: Sparkles },
  ];
  return <section className="metric-strip" aria-label="Workspace statistics">{metrics.map(({ label, value, detail, icon: Icon, tone }) => <article className="live-metric" key={label}><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone ?? ""}`}><Icon size={18} strokeWidth={1.8} /></span></div><strong>{value}</strong><small>{detail}</small></article>)}</section>;
}

function Dashboard({ user, onSignedOut }: { user: AuthUser; onSignedOut: () => void }) {
  const live = useWorkspace(onSignedOut);
  const [section, setSection] = useState(() => resolveWorkspaceSection(user.role, window.location.hash.slice(1)));
  const [logoutError, setLogoutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    const restore = () => setSection(resolveWorkspaceSection(user.role, window.location.hash.slice(1)));
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", restore);
    return () => { window.removeEventListener("popstate", restore); window.removeEventListener("hashchange", restore); };
  }, [user.role]);
  function navigate(next: string) {
    const resolved = resolveWorkspaceSection(user.role, next);
    if (resolved === section) return;
    setSection(resolved);
    window.history.pushState({}, "", `${rolePath(user.role)}#${resolved}`);
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(() => {
      if (!document.querySelector('[aria-modal="true"]')) document.getElementById("workspace-title")?.focus({ preventScroll: true });
    });
  }
  async function logout() {
    if (signingOut) return;
    setSigningOut(true); setLogoutError("");
    try { await logoutFromApi(); onSignedOut(); }
    catch (error) { if (error instanceof ApiError && error.status === 401) onSignedOut(); else setLogoutError("Could not sign out. Check your connection and try again."); }
    finally { setSigningOut(false); }
  }
  const shared = { data: live.data!, mutate: live.mutate, section, onSectionChange: navigate, busy: live.busy, actionError: live.actionError };
  return <WorkspaceShell user={user} section={section} onSectionChange={navigate} connected={!live.connectionError} syncing={live.busy} lastSynced={live.lastSynced} onRefresh={() => void live.refresh()} onLogout={() => void logout()} signingOut={signingOut}>
    {(live.connectionError || live.actionError || logoutError) && <p role="alert" className="live-warning">{live.actionError || live.connectionError || logoutError}</p>}
    {!live.data && <div className="workspace-loading" role="status"><span className="loading-orbit" /><h2>{live.connectionError ? "Let’s get you reconnected." : "Getting your workspace ready."}</h2><p>{live.connectionError ? "Keep the laptop and API running. We’ll try again shortly." : "Your campus is just a moment away."}</p></div>}
    {live.data && <>
      <Metrics user={user} data={live.data} />
      <fieldset className="live-workspace" disabled={live.busy || Boolean(live.connectionError)} aria-busy={live.busy}>
        {user.role === "customer" && <Marketplace {...shared} />}
        {user.role === "store" && <SellerWorkspace {...shared} />}
        {user.role === "courier" && <RiderWorkspace {...shared} />}
        {user.role === "admin" && <AdminWorkspace {...shared} />}
      </fieldset>
    </>}
  </WorkspaceShell>;
}

function App() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [loadingError, setLoadingError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let mounted = true;
    setLoadingError("");
    getCurrentUser().then((next) => {
      if (!mounted) return;
      const nextSection = resolveWorkspaceSection(next.role, window.location.hash.slice(1));
      window.history.replaceState({}, "", `${rolePath(next.role)}#${nextSection}`);
      setUser(next);
    }).catch((error) => {
      if (!mounted) return;
      if (error instanceof ApiError && error.status === 401) setUser(null);
      else setLoadingError("Unable to reach UniServe. Start the backend and check your connection.");
    });
    return () => { mounted = false; };
  }, [attempt]);
  if (user === undefined) return <main className="auth-shell"><section className="auth-card"><span className="auth-kicker">UniServe</span><h1>Your campus, connected.</h1><p role="status">{loadingError || "Getting things ready…"}</p>{loadingError && <button className="primary-button" onClick={() => setAttempt(attempt + 1)}>Try again</button>}</section></main>;
  if (!user) return <AuthScreen onAuthenticated={(next) => { window.history.replaceState({}, "", `${rolePath(next.role)}#${resolveWorkspaceSection(next.role, "")}`); setUser(next); }} />;
  return <Dashboard key={user.id} user={user} onSignedOut={() => { setUser(null); window.history.replaceState({}, "", "/"); }} />;
}

export default App;
