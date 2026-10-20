import { useEffect, useRef, useState } from "react";
import { apiRequest, ApiError } from "./apiClient";
import { createWorkspaceSync } from "./workspaceSync";

export type PublicUser = { id: string; name: string; email?: string; role?: string; active?: boolean };
export type Product = { id: string; name: string; price: number; available: boolean; shopId: string };
export type Shop = {
  id: string; ownerId: string; name: string; category: string; location: string;
  operatingHours: string; open: boolean; verification: "PENDING" | "VERIFIED" | "REJECTED";
  items: Product[]; salesToday: number; rating: number;
};
export type Rider = {
  id: string; userId: string; user?: PublicUser; verified: boolean;
  availability: "ONLINE" | "OFFLINE"; currentPoint?: string | null;
  earningsToday: number; deliveriesToday: number;
};
export type LiveOrder = {
  id: string; customerId?: string; shopId: string; riderId: string | null;
  serviceType: string; pickupPoint: string; dropoffPoint: string;
  status: "PENDING" | "ACCEPTED" | "PICKED_UP" | "ON_THE_WAY" | "DELIVERED" | "CANCELLED";
  shopStatus: "NEW" | "PREPARING" | "READY_FOR_PICKUP" | "COMPLETED";
  paymentMethod: "COD" | "EWALLET"; subtotal: number; deliveryFee: number; total: number;
  customerNote?: string | null; createdAt: string; customer?: PublicUser; shop: Shop;
  items: { id: string; shopItemId: string | null; name: string; quantity: number; unitPrice: number }[];
  rating?: { score: number; comment?: string | null } | null;
  chatThread?: { messages: { id: string; content: string; createdAt: string; sender?: PublicUser }[] } | null;
};
export type LiveComplaint = { id: string; subject: string; detail: string; status: "OPEN" | "RESOLVED"; resolution?: string | null };
export type Workspace = { shops: Shop[]; orders: LiveOrder[]; rider: Rider | null; riders: Rider[]; users: PublicUser[]; complaints: LiveComplaint[] };
export type Mutate = (path: string, body?: unknown, method?: "POST" | "PATCH") => Promise<boolean>;

export function useWorkspace(onExpired: () => void) {
  const [data, setData] = useState<Workspace | null>(null);
  const [connectionError, setConnectionError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const expiredRef = useRef(onExpired);
  expiredRef.current = onExpired;
  const syncRef = useRef<ReturnType<typeof createWorkspaceSync<Workspace>> | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;
    const handleError = (error: Error, action: boolean) => {
      if (error instanceof ApiError && error.status === 401) expiredRef.current();
      else (action ? setActionError : setConnectionError)(error.message);
    };
    const sync = createWorkspaceSync(
      (signal) => apiRequest<Workspace>("/api/workspace", { signal }),
      (next) => { setData(next); setConnectionError(""); setLastSynced(new Date()); },
      (error) => handleError(error, busyRef.current),
    );
    syncRef.current = sync;
    const poll = async () => {
      if (!busyRef.current) await sync.refresh();
      if (mounted) timer = setTimeout(poll, 2000);
    };
    void poll();
    return () => { mounted = false; clearTimeout(timer); sync.dispose(); syncRef.current = null; };
  }, []);

  const mutate: Mutate = async (path, body, method = "POST") => {
    if (busyRef.current || !syncRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setActionError("");
    try {
      return await syncRef.current.mutate(() => apiRequest(path, { method, body: body === undefined ? undefined : JSON.stringify(body) }));
    } finally { busyRef.current = false; setBusy(false); }
  };
  return { data, connectionError, actionError, busy, lastSynced, mutate, refresh: () => syncRef.current?.refresh() };
}
