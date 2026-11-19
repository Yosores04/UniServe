import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { Map as LibreMap } from "maplibre-gl";
import { mapPoint, type MapPoint } from "../../lib/workspace";
import "maplibre-gl/dist/maplibre-gl.css";
import "./campusMap.css";

export type CampusMarker = MapPoint & { id: string; label: string };
type MapProps = {
  markers: CampusMarker[];
  onPick?: (point: MapPoint) => void;
  onSelect?: (id: string) => void;
};

// DICT's Public Internet Connectivity for SUCs, Annex A.1, BukSU Malaybalay.
const campusCenter: [number, number] = [125.12485, 8.157416];
const styleUrl = import.meta.env.VITE_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/liberty";
const trackingSymbols = new Map([["pickup", "P"], ["dropoff", "D"], ["courier", "C"]]);

export default function CampusMap({ markers, onPick, onSelect }: MapProps) {
  const container = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onPick, onSelect });
  callbacks.current = { onPick, onSelect };
  const [loaded, setLoaded] = useState<{ map: LibreMap; lib: typeof import("maplibre-gl") } | null>(null);
  const [failed, setFailed] = useState(false);
  const camera = useRef<{ map: LibreMap; pins: string } | null>(null);
  // Polling parents often supply a fresh array containing the same pins.
  const signature = JSON.stringify(markers.filter(pin => mapPoint(pin.latitude, pin.longitude)).map(({ id, label, latitude, longitude }) => ({ id, label, latitude, longitude })));
  const pins = useMemo(() => JSON.parse(signature) as CampusMarker[], [signature]);
  const selectable = Boolean(onSelect);
  const tracking = !onPick && !onSelect && pins.length > 0 && pins.every(pin => trackingSymbols.has(pin.id));

  useEffect(() => {
    if (failed) return;
    let cancelled = false;
    let map: LibreMap | undefined;
    let observer: ResizeObserver | undefined;
    const unavailable = () => { if (!cancelled) setFailed(true); };
    const timeout = window.setTimeout(unavailable, 20000);
    async function start() {
      try {
        const lib = await import("maplibre-gl");
        if (cancelled || !container.current) return;
        map = new lib.Map({ container: container.current, style: styleUrl, center: campusCenter, zoom: 16, attributionControl: { compact: false } });
        map.addControl(new lib.NavigationControl({ showCompass: false }), "top-right");
        map.on("error", unavailable);
        map.on("webglcontextlost", unavailable);
        map.on("load", () => {
          window.clearTimeout(timeout);
          if (!cancelled && map) setLoaded({ map, lib });
        });
        map.on("click", ({ lngLat }) => callbacks.current.onPick?.({ latitude: lngLat.lat, longitude: lngLat.wrap().lng }));
        observer = new ResizeObserver(() => map?.resize());
        observer.observe(container.current);
      } catch { unavailable(); }
    }
    void start();
    window.addEventListener("offline", unavailable);
    return () => {
      cancelled = true;
      window.removeEventListener("offline", unavailable);
      window.clearTimeout(timeout);
      observer?.disconnect();
      map?.remove();
      setLoaded(null);
    };
  }, [failed]);

  useEffect(() => {
    if (!loaded || failed) return;
    const { lib, map } = loaded;
    const bounds = new lib.LngLatBounds();
    const rendered = pins.map(pin => {
      const position: [number, number] = [pin.longitude, pin.latitude];
      bounds.extend(position);
      const element = document.createElement(selectable ? "button" : "div");
      element.className = "campus-map-marker";
      if (tracking) {
        element.dataset.trackingPin = pin.id;
        element.dataset.symbol = trackingSymbols.get(pin.id);
      }
      element.setAttribute("aria-label", pin.label);
      element.title = pin.label;
      if (element instanceof HTMLButtonElement) {
        element.type = "button";
        element.addEventListener("click", event => {
          event.stopPropagation();
          callbacks.current.onSelect?.(pin.id);
        });
      } else {
        element.setAttribute("role", "img");
      }
      return new lib.Marker({ element, anchor: "bottom" }).setLngLat(position).addTo(map);
    });
    const pinIds = pins.map(pin => pin.id).join(",");
    if (!tracking || camera.current?.map !== map || camera.current.pins !== pinIds) {
      if (pins.length > 1) map.fitBounds(bounds, { padding: 42, maxZoom: 17, duration: 0 });
      else if (pins.length === 1) map.jumpTo({ center: bounds.getCenter() });
      camera.current = { map, pins: pinIds };
    }
    return () => { rendered.forEach(marker => marker.remove()); };
  }, [loaded, failed, pins, selectable, tracking]);

  return <div className="campus-map">
    {failed ? <div className="campus-map-fallback">
      <MapPin aria-hidden="true" size={22} />
      <p role="status">Campus map unavailable.</p>
      <button className="chip-button" type="button" onClick={() => setFailed(false)}>Retry map</button>
      {pins.length > 0 && <ul>{pins.map(pin => <li key={pin.id}>{onSelect
        ? <button className="chip-button" type="button" onClick={() => onSelect(pin.id)}>{pin.label}</button>
        : pin.label} <small>{pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}</small></li>)}</ul>}
    </div> : <>
      <div className="campus-map-canvas" ref={container} role="region" aria-label="BukSU campus map" />
      {!loaded && <span className="campus-map-loading" role="status">Loading campus map…</span>}
      {loaded && tracking && <ul className="campus-tracking-legend" aria-label="Delivery locations">{pins.map(pin => <li key={pin.id}>
        <button type="button" title={`Center map on ${pin.label}`} onClick={() => loaded.map.jumpTo({ center: [pin.longitude, pin.latitude], zoom: Math.max(16, loaded.map.getZoom()) })}>
          <span aria-hidden="true" data-tracking-pin={pin.id}>{trackingSymbols.get(pin.id)}</span>{pin.label}
        </button>
      </li>)}</ul>}
    </>}
  </div>;
}

type PickerProps = { value: MapPoint | null; onChange: (point: MapPoint | null) => void; label: string };

export function PinPicker({ value, onChange, label }: PickerProps) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  useEffect(() => {
    setLat(value?.latitude.toString() ?? "");
    setLng(value?.longitude.toString() ?? "");
  }, [value?.latitude, value?.longitude, open]);
  const draft = { latitude: Number(lat), longitude: Number(lng) };
  const canApply = lat.trim() !== "" && lng.trim() !== "" && Boolean(mapPoint(draft.latitude, draft.longitude));
  function pick(point: MapPoint) {
    onChange({ latitude: Number(point.latitude.toFixed(6)), longitude: Number(point.longitude.toFixed(6)) });
  }
  return <section className="campus-pin-picker" aria-label={label}>
    <div className="campus-pin-heading">
      <div><strong>{label}</strong>{value && <small>{value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}</small>}</div>
      <button type="button" className="chip-button" aria-controls={panel} aria-expanded={open} onClick={() => setOpen(!open)}>
        <MapPin size={15} aria-hidden="true" />{open ? "Close map" : value ? "Edit pin" : "Choose pin"}
      </button>
    </div>
    <div id={panel} hidden={!open}>{open && <>
      <p>Tap the map or enter coordinates to place the pin.</p>
      <CampusMap markers={value ? [{ ...value, id: "selected", label }] : []} onPick={pick} />
      <div className="campus-coordinates">
        <label>Latitude<input type="number" step="any" min="-90" max="90" value={lat} onChange={e => setLat(e.target.value)} /></label>
        <label>Longitude<input type="number" step="any" min="-180" max="180" value={lng} onChange={e => setLng(e.target.value)} /></label>
      </div>
      <div className="row-actions">
        <button className="secondary-button" type="button" disabled={!canApply} onClick={() => pick(draft)}>Use coordinates</button>
        {value && <button className="chip-button" type="button" onClick={() => onChange(null)}>Remove pin</button>}
      </div>
    </>}</div>
  </section>;
}
