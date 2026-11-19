import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import CampusMap from "../../components/maps/CampusMap";
import { apiRequest } from "../../lib/apiClient";
import { startCourierSharing } from "../../lib/courierSharing";
import type { LiveOrder } from "../../lib/workspace";

type Fix = { latitude: number; longitude: number; recordedAt: string };

function OrderMap({ order }: { order: LiveOrder }) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [readState, setReadState] = useState<"loading" | "ready" | "error">("loading");
  const [visible, setVisible] = useState(() => !document.hidden);
  const [now, setNow] = useState(Date.now);
  const active = !!order.riderId && ["ACCEPTED", "PICKED_UP", "ON_THE_WAY"].includes(order.status);
  useEffect(() => {
    const changed = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", changed);
    return () => document.removeEventListener("visibilitychange", changed);
  }, []);
  useEffect(() => {
    if (!active || !visible) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const { location } = await apiRequest<{ location: Fix | null }>(`/api/customer/orders/${order.id}/location`, { signal: controller.signal });
        if (!controller.signal.aborted) { setFix(location); setReadState("ready"); }
      } catch {
        if (!controller.signal.aborted) setReadState("error");
      } finally {
        if (!controller.signal.aborted) { setNow(Date.now()); timer = setTimeout(poll, 8000); }
      }
    }
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [order.id, active, visible]);

  const markers = [];
  if (order.pickupLatitude != null && order.pickupLongitude != null) {
    markers.push({ id: "pickup", label: `Pickup · ${order.pickupPoint}`, latitude: order.pickupLatitude, longitude: order.pickupLongitude });
  }
  if (order.dropoffLatitude != null && order.dropoffLongitude != null) {
    markers.push({ id: "dropoff", label: `Drop-off · ${order.dropoffPoint}`, latitude: order.dropoffLatitude, longitude: order.dropoffLongitude });
  }
  let status = "Location sharing has ended.";
  if (order.status === "PENDING") status = "Waiting for a courier to accept your delivery.";
  if (active) {
    status = readState === "loading" ? "Checking courier location…" : "Your courier hasn’t shared a location.";
    if (fix) {
      const stale = now - Date.parse(fix.recordedAt) > 60000 || readState === "error";
      const label = stale ? "Last known courier location" : "Courier location";
      markers.push({ id: "courier", label, latitude: fix.latitude, longitude: fix.longitude });
      status = `${label} · Updated ${new Date(fix.recordedAt).toLocaleString("en-PH")}`;
    }
    if (readState === "error") status = `Tracking connection interrupted. Retrying. ${fix ? status : ""}`.trim();
  }
  return <div className="delivery-tracking-body">
    <p className="live-muted" role="status">{status}</p>
    {markers.length > 0 ? <CampusMap markers={markers} /> : <p className="live-muted">No map pins are available for this order.</p>}
  </div>;
}

export function CustomerTracking({ order }: { order: LiveOrder }) {
  const [expanded, setExpanded] = useState(false);
  return <details className="order-conversation" onToggle={(event) => setExpanded(event.currentTarget.open)}>
    <summary><MapPin size={14} />Track delivery</summary>
    {expanded && <OrderMap key={order.id} order={order} />}
  </details>;
}

export function CourierSharing({ orderId }: { orderId: string }) {
  const session = useRef<ReturnType<typeof startCourierSharing> | null>(null);
  const generation = useRef(0);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("Share your location with this customer while the app is open.");
  function stop() {
    const current = session.current;
    if (!current) return;
    session.current = null;
    const version = ++generation.current;
    setSharing(false);
    setMessage("Location sharing stopped.");
    void current.stop().catch(() => {
      if (generation.current === version) setMessage("GPS stopped. Your last shared position may still be visible.");
    });
  }
  useEffect(() => {
    const visibilityChanged = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", visibilityChanged);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("pagehide", stop);
      ++generation.current;
      void session.current?.stop().catch(() => {});
      session.current = null;
    };
  }, [orderId]);
  function start() {
    if (session.current || document.hidden) return;
    if (!navigator.geolocation) {
      setMessage("Location is unavailable. Open the Android app or use an HTTPS connection in a supported browser.");
      return;
    }
    const version = ++generation.current;
    setMessage("Waiting for location permission and a GPS signal…");
    try {
      session.current = startCourierSharing(orderId, navigator.geolocation, apiRequest, (text, stopped) => {
        if (generation.current !== version) return;
        setMessage(text);
        if (stopped) { session.current = null; setSharing(false); }
      });
      setSharing(true);
    } catch {
      setMessage("Could not start GPS. Check the app’s location permission.");
    }
  }
  return <div className="delivery-tracking-body">
    <button type="button" className="secondary-button" aria-pressed={sharing} onClick={sharing ? stop : start}><Navigation size={14} />{sharing ? "Stop sharing" : "Share my location"}</button>
    <p className="live-muted" role="status">{message}</p>
  </div>;
}
