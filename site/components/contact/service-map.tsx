"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import type { ServiceAddress } from "@/lib/contact-intake";
import { loadMap, mapboxToken, mapsConfigured } from "@/lib/contact-maps";
import "mapbox-gl/dist/mapbox-gl.css";
import s from "./contact-quiz.module.css";
export function ServiceMap({
  address,
  onEvent,
}: {
  address: ServiceAddress;
  onEvent?: (event: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    map = useRef<MapboxMap | null>(null),
    marker = useRef<Marker | null>(null),
    events = useRef(onEvent);
  useEffect(() => {
    events.current = onEvent;
  }, [onEvent]);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(!mapsConfigured);
  useEffect(() => {
    let cancelled = false;
    let instance: MapboxMap | undefined;
    if (!mapsConfigured) return;
    void loadMap()
      .then((sdk) => {
        if (cancelled || !host.current) return;
        const m = new sdk.default.Map({
          container: host.current,
          accessToken: mapboxToken,
          style: "mapbox://styles/mapbox/light-v11",
          center: [-118.02, 33.82],
          zoom: 8.6,
          interactive: false,
          attributionControl: false,
        });
        instance = m;
        map.current = m;
        m.addControl(new sdk.default.AttributionControl({ compact: true }));
        m.on("load", () => {
          if (!cancelled) {
            setReady(true);
            setFailed(false);
            events.current?.("contact_map_loaded");
          }
        });
        m.on("error", () => {
          if (!cancelled && !m.isStyleLoaded()) {
            setFailed(true);
            events.current?.("contact_map_failed");
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          events.current?.("contact_map_failed");
        }
      });
    return () => {
      cancelled = true;
      instance?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (!ready || !map.current) return;
    marker.current?.remove();
    if (address.lat === undefined || address.lng === undefined) {
      map.current.jumpTo({ center: [-118.02, 33.82], zoom: 8.6 });
      return;
    }
    const center: [number, number] = [address.lng, address.lat];
    void loadMap().then((sdk) => {
      if (cancelled || !map.current) return;
      marker.current = new sdk.default.Marker({ color: "#ee812d", scale: 0.8 })
        .setLngLat(center)
        .addTo(map.current);
      map.current.flyTo({
        center,
        zoom: 16.3,
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 1200,
        essential: false,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [ready, address.lat, address.lng]);
  return (
    <div
      className={`${s["map-wrap"]} ph-no-capture`}
      aria-label={
        address.lat !== undefined
          ? "Selected service location"
          : "Southern California map"
      }
    >
      <div className={s["map-canvas"]} ref={host} />
      {failed && (
        <div className={s["map-fallback"]}>
          You can keep going without the map.
        </div>
      )}
    </div>
  );
}
