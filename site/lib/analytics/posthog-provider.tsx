"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

const defaultPosthogHost = "https://us.i.posthog.com";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname;
      const search = searchParams.toString();

      if (search) {
        url += "?" + search;
      }

      ph.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, ph]);

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
  useEffect(() => {
    if (typeof window !== "undefined" && publicKey) {
      posthog.init(publicKey, {
        api_host: apiHost,
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: true,
        persistence: "localStorage+cookie",
      });
    }
  }, [apiHost, publicKey]);

  if (!publicKey) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
