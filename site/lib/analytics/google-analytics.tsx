"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { isAnalyticsExcluded } from "./traffic-mode";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const ATTRIBUTION_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "gclid", "gbraid", "wbraid", "msclkid",
]);

function GoogleAnalyticsPageView({ ready }: { ready: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPageLocation = useRef("");

  useEffect(() => {
    if (!ready || !pathname || typeof window.gtag !== "function" || isAnalyticsExcluded()) {
      return;
    }

    const attribution = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (ATTRIBUTION_PARAMS.has(key.toLowerCase())) attribution.append(key, value);
    });
    const pagePath = `${pathname}${attribution.size ? `?${attribution}` : ""}`;
    const pageLocation = new URL(pagePath, window.location.origin).href;
    if (lastPageLocation.current === pageLocation) return;
    lastPageLocation.current = pageLocation;

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: pageLocation,
      page_title: document.title,
    });
  }, [ready, pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only QA preference
    setAllowed(!isAnalyticsExcluded());
  }, []);
  if (!measurementId || !allowed) {
    return null;
  }

  return (
    <>
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <Suspense fallback={null}>
        <GoogleAnalyticsPageView ready={ready} />
      </Suspense>
    </>
  );
}
