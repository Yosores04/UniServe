import { useState } from "react";
import { createDemoState } from "./lib/demoState";
import { MetricStrip, UniversityHeader } from "./components/DemoKit";
import { AuthScreen } from "./components/AuthScreen";
import type { AuthUser } from "./lib/auth";
import { AdminPortal } from "./portals/AdminPortal";
import { CourierPortal } from "./portals/CourierPortal";
import { CustomerPortal } from "./portals/CustomerPortal";
import { EntrepreneurPortal } from "./portals/EntrepreneurPortal";
import type { DemoState, Role, ServiceType } from "./types";

function App() {
  const [role, setRole] = useState<Role>("customer");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [state, setState] = useState<DemoState>(() => createDemoState());
  const [serviceType, setServiceType] = useState<ServiceType>("Food");
  const [storeId, setStoreId] = useState("canteen-express");
  const [pickupPoint, setPickupPoint] = useState("Main Canteen");
  const [dropoffPoint, setDropoffPoint] = useState("College of Technologies");
  const [note, setNote] = useState("Please meet me near the lobby.");

  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={(nextUser) => {
          setUser(nextUser);
          setRole(nextUser.role);
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
        onLogout={() => setUser(null)}
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
        <AdminPortal state={state} setRole={setRole} setState={setState} />
      )}
    </main>
  );
}

export default App;
