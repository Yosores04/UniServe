type LocationWriter = (path: string, options: RequestInit) => Promise<unknown>;
type Report = (message: string, stopped?: boolean) => void;

// Serialize writes across starts, stops and remounts for the same delivery.
const writes = new Map<string, Promise<unknown>>();
function enqueue(path: string, action: () => Promise<unknown>) {
  const previous = writes.get(path) ?? Promise.resolve();
  const next = previous.then(action, action);
  writes.set(path, next);
  const release = () => { if (writes.get(path) === next) writes.delete(path); };
  void next.then(release, release);
  return next;
}

export function startCourierSharing(orderId: string, gps: Pick<Geolocation, "watchPosition" | "clearWatch">, write: LocationWriter, report: Report) {
  const path = `/api/rider/deliveries/${orderId}/location`;
  let stopped = false;
  let removal: Promise<unknown> | undefined;
  let watch: number | undefined;
  let latest: GeolocationPosition | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sending = false;
  let nextSend = 0;

  function stop() {
    if (!stopped) {
      stopped = true;
      clearTimeout(timer);
      if (watch !== undefined) gps.clearWatch(watch);
      removal = enqueue(path, () => write(path, { method: "DELETE", keepalive: true }));
    }
    return removal!;
  }

  function schedule() {
    if (sending || stopped || timer !== undefined || !latest) return;
    timer = setTimeout(async () => {
      timer = undefined;
      const fix = latest!;
      latest = undefined;
      sending = true;
      try {
        await enqueue(path, async () => {
          if (stopped) return;
          const { latitude, longitude } = fix.coords;
          await write(path, { method: "PATCH", body: JSON.stringify({ latitude, longitude, recordedAt: new Date(fix.timestamp).toISOString() }) });
        });
        if (!stopped) report("Sharing your location with this customer.");
      } catch {
        if (!stopped) report("Could not send your location. Check your connection.");
      } finally {
        sending = false;
        nextSend = Date.now() + 5000;
        schedule();
      }
    }, Math.max(0, nextSend - Date.now()));
  }

  watch = gps.watchPosition((fix) => {
    if (stopped) return;
    latest = fix;
    schedule();
  }, (error) => {
    if (stopped) return;
    if (error.code === 1) {
      report("Location permission was denied. Allow location access to share this delivery.", true);
      void stop().catch(() => report("Location access was denied. Your last shared position may still be visible.", true));
    } else {
      report("Waiting for a GPS signal. You can stop sharing at any time.");
    }
  }, { maximumAge: 0, timeout: 15000, enableHighAccuracy: true });
  return { stop };
}
