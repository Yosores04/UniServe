import { useEffect, useState } from "react";
import { PortalHero, UniversityHeader, money } from "./components/DemoKit";
import { AuthScreen } from "./components/AuthScreen";
import type { AuthUser } from "./lib/auth";
import { getCurrentUser, logoutFromApi } from "./lib/authClient";
import { ApiError } from "./lib/apiClient";
import { rolePath } from "./app/router";
import { useWorkspace } from "./lib/workspace";
import { Marketplace } from "./portals/live/Marketplace";
import { SellerWorkspace } from "./portals/live/SellerWorkspace";
import { RiderWorkspace } from "./portals/live/RiderWorkspace";
import { AdminWorkspace } from "./portals/live/AdminWorkspace";

function Dashboard({ user, onSignedOut }: { user: AuthUser; onSignedOut: () => void }) {
  const live = useWorkspace(onSignedOut);
  const [logoutError, setLogoutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const data = live.data;
  const active = data?.orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)).length ?? 0;
  const delivered = data?.orders.filter((order) => order.status === "DELIVERED") ?? [];
  const revenue = delivered.reduce((sum, order) => sum + order.deliveryFee, 0);
  return <main className="app-shell">
    <UniversityHeader activeRole={user.role} userName={user.name} onLogout={async () => {
      if (signingOut) return;
      setSigningOut(true); setLogoutError("");
      try { await logoutFromApi(); onSignedOut(); }
      catch (error) {
        if (error instanceof ApiError && error.status === 401) onSignedOut();
        else setLogoutError("Could not sign out. Check your connection and try again.");
      } finally { setSigningOut(false); }
    }} />
    <div className={`live-sync ${live.connectionError ? "disconnected" : ""}`}>
      <span>{live.connectionError ? "Connection interrupted · retrying" : live.lastSynced ? `Synced ${live.lastSynced.toLocaleTimeString("en-PH")} · updates every 2 seconds` : "Connecting to campus services…"}</span>
      <button className="chip-button" disabled={live.busy} onClick={() => void live.refresh()}>Refresh now</button>
    </div>
    {(live.connectionError || live.actionError || logoutError) && <p role="alert" className="live-warning">{live.actionError || live.connectionError || logoutError}</p>}
    {!data && <div className="empty-state">{live.connectionError ? "Waiting for the server. Keep the laptop and API running." : "Loading your workspace…"}</div>}
    {data && <>
      <section className="metric-strip" aria-label="Workspace statistics">
        <div className="live-metric"><span>{user.role === "store" ? "My shop" : "Visible shops"}</span><strong>{data.shops.length}</strong></div>
        <div className="live-metric"><span>Active orders</span><strong>{active}</strong></div>
        <div className="live-metric"><span>Delivered orders</span><strong>{delivered.length}</strong></div>
        <div className="live-metric"><span>{user.role === "store" ? "Shop sales today" : user.role === "courier" ? "Earnings today" : "Completed delivery fees"}</span><strong>{money(user.role === "store" ? data.shops[0]?.salesToday ?? 0 : user.role === "courier" ? data.rider?.earningsToday ?? 0 : revenue)}</strong></div>
      </section>
      <PortalHero role={user.role} stat={{ label: "Active requests", value: String(active) }} aside="Shared campus workspace" />
      {live.busy && <p className="live-saving" role="status">Saving your change…</p>}
      <fieldset className="live-workspace" disabled={live.busy || Boolean(live.connectionError)} aria-busy={live.busy}>
        {user.role === "customer" && <Marketplace data={data} mutate={live.mutate} />}
        {user.role === "store" && <SellerWorkspace data={data} mutate={live.mutate} />}
        {user.role === "courier" && <RiderWorkspace data={data} mutate={live.mutate} />}
        {user.role === "admin" && <AdminWorkspace data={data} mutate={live.mutate} />}
      </fieldset>
    </>}
  </main>;
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
      setUser(next);
      window.history.replaceState({}, "", rolePath(next.role));
    }).catch((error) => {
      if (!mounted) return;
      if (error instanceof ApiError && error.status === 401) setUser(null);
      else setLoadingError("Unable to reach UniServe. Start the backend and check your connection.");
    });
    return () => { mounted = false; };
  }, [attempt]);

  if (user === undefined) return <main className="auth-shell"><section className="auth-card"><p role="status">{loadingError || "Loading UniServe…"}</p>{loadingError && <button className="primary-button" onClick={() => setAttempt(attempt + 1)}>Try again</button>}</section></main>;
  if (!user) return <AuthScreen onAuthenticated={(next) => { setUser(next); window.history.replaceState({}, "", rolePath(next.role)); }} />;
  return <Dashboard key={user.id} user={user} onSignedOut={() => { setUser(null); window.history.replaceState({}, "", "/"); }} />;
}

export default App;
