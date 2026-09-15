"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { loadMap, mapsConfigured } from "@/lib/contact-maps";
import type { ServiceAddress } from "@/lib/contact-intake";
import s from "./contact-quiz.module.css";
function subscribeViewport(callback: () => void) {
  const query = window.matchMedia("(min-width: 701px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const isDesktop = () => window.matchMedia("(min-width: 701px)").matches;
export function ServiceMap({ address }: { address: ServiceAddress }) {
  const desktop = useSyncExternalStore(
    subscribeViewport,
    isDesktop,
    () => false,
  );
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!mapsConfigured);
  useEffect(() => {
    let cancelled = false;
    if (!mapsConfigured || !desktop) return;
    loadMap()
      .then(({ Map }) => {
        if (cancelled || !host.current) return;
        map.current = new Map(host.current, {
          center: { lat: 33.45, lng: -117.95 },
          zoom: 8,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "none",
          keyboardShortcuts: false,
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      map.current = null;
    };
  }, [desktop]);
  useEffect(() => {
    if (!ready || !map.current) return;
    if (address.lat === undefined || address.lng === undefined) {
      map.current.setCenter({ lat: 33.45, lng: -117.95 });
      map.current.setZoom(8);
      return;
    }
    const point = { lat: address.lat, lng: address.lng };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      map.current.setCenter(point);
    else map.current.panTo(point);
    map.current.setZoom(17);
  }, [ready, address.lat, address.lng]);
  return (
    <aside className={s.map} aria-label="Service area map">
      {!desktop ? null : failed ? (
        <iframe
          tabIndex={-1}
          title="Southern California service area"
          src="https://maps.google.com/maps?ll=33.45,-117.95&z=8&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div ref={host} className={s.mapCanvas} />
      )}
      {ready && address.lat !== undefined && (
        <MapPinIcon className={s.mapPin} aria-label="Selected location" />
      )}
      {address.formatted && (
        <div className={`${s.mapAddress} ph-no-capture`}>
          <MapPinIcon aria-hidden="true" />
          <span>{address.formatted}</span>
        </div>
      )}
    </aside>
  );
}
