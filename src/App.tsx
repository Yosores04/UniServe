import { useEffect, useState } from "react";
import { createDemoState } from "./lib/demoState";
import { MetricStrip, UniversityHeader } from "./components/DemoKit";
import { AuthScreen } from "./components/AuthScreen";
import type { AuthUser } from "./lib/auth";
import { getCurrentUser, logoutFromApi } from "./lib/authClient";
import { canAccessPath, rolePath } from "./app/router";
import { AdminPortal } from "./portals/AdminPortal";
import { CourierPortal } from "./portals/CourierPortal";
import { CustomerPortal } from "./portals/CustomerPortal";
import { EntrepreneurPortal } from "./portals/EntrepreneurPortal";
import type { DemoState, Role, ServiceType } from "./types";

function App() {
  const [role, setRole] = useState<Role>("customer");
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [state, setState] = useState<DemoState>(() => createDemoState());
  const [serviceType, setServiceType] = useState<ServiceType>("Food");
  const [storeId, setStoreId] = useState("canteen-express");
  const [pickupPoint, setPickupPoint] = useState("Main Canteen");
  const [dropoffPoint, setDropoffPoint] = useState("College of Technologies");
  const [note, setNote] = useState("Please meet me near the lobby.");

  useEffect(() => {
    getCurrentUser().then((nextUser) => {
      setUser(nextUser);
      setRole(nextUser.role);
      if (!canAccessPath(nextUser.role, window.location.pathname)) window.history.replaceState({}, "", rolePath(nextUser.role));
    }).catch(() => setUser(null));
  }, []);

  async function logout() {
    await logoutFromApi().catch(() => undefined);
    setUser(null);
  }

  if (user === undefined) {
    return <main className="auth-shell"><p>Loading UniServe...</p></main>;
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={(nextUser) => {
          setUser(nextUser);
          setRole(nextUser.role);
          window.history.replaceState({}, "", rolePath(nextUser.role));
        }}
      />
    );
  }

  return (
    <main className="app-shell">
      <UniversityHeader
        activeRole={role}
        setRole={setRole}
        userName={user.name}
        onLogout={logout}
        onReset={() => {
          setState(createDemoState());
          setUser(null);
        }}
      />
      <MetricStrip state={state} />

      {role === "customer" && (
        <CustomerPortal
          state={state}
          setState={setState}
          serviceType={serviceType}
          setServiceType={setServiceType}
          storeId={storeId}
          setStoreId={setStoreId}
          pickupPoint={pickupPoint}
          setPickupPoint={setPickupPoint}
          dropoffPoint={dropoffPoint}
          setDropoffPoint={setDropoffPoint}
          note={note}
          setNote={setNote}
        />
      )}

      {role === "courier" && (
        <CourierPortal state={state} setState={setState} />
      )}
      {role === "store" && (
        <EntrepreneurPortal state={state} setState={setState} />
      )}
      {role === "admin" && (
        <AdminPortal state={state} setState={setState} />
      )}
    </main>
  );
}

export default App;
