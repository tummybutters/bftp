"use client";

import { PhoneTracker } from "./phone-tracker";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useEffect,
  Suspense,
  createContext,
  useContext,
  useState,
} from "react";

const AnalyticsReady = createContext(false);
export const useAnalyticsReady = () => useContext(AnalyticsReady);

const defaultPosthogHost = "https://us.i.posthog.com";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();
  const ready = useAnalyticsReady();

  useEffect(() => {
    if (pathname && ph && ready) {
      let url = window.origin + pathname;
      const search = searchParams.toString();

      if (search) {
        url += "?" + search;
      }

      try {
        ph.capture("$pageview", { $current_url: url });
      } catch {
        /* Analytics must not interrupt navigation. */
      }
    }
  }, [pathname, searchParams, ph, ready]);

  return null;
}

export function PostHogProvider({
  apiHost = defaultPosthogHost,
  children,
  publicKey,
}: {
  apiHost?: string;
  children: React.ReactNode;
  publicKey?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && publicKey) {
      try {
        posthog.init(publicKey, {
          api_host: apiHost,
          capture_pageview: false,
          capture_pageleave: true,
          autocapture: true,
          mask_all_element_attributes: true,
          mask_all_text: true,
          session_recording: {
            maskAllInputs: true,
            blockClass: "ph-no-capture",
            maskTextSelector: ".ph-no-capture",
          },
          loaded: () => setReady(true),
          persistence: "localStorage+cookie",
        });
      } catch {
        /* The website remains usable if analytics cannot initialize. */
      }
    }
  }, [apiHost, publicKey]);

  if (!publicKey) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <AnalyticsReady.Provider value={ready}>
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
        <PhoneTracker />
        {children}
      </AnalyticsReady.Provider>
    </PHProvider>
  );
}
