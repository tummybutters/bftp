"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { usePathname } from "next/navigation";

const THRESHOLDS = [25, 50, 75, 90];

export function useScrollDepth() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const fired = useRef(new Set<number>());

  useEffect(() => {
    fired.current.clear();
  }, [pathname]);

  useEffect(() => {
    if (!posthog) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight <= 0) return;

      const percent = Math.round((scrollTop / docHeight) * 100);

      for (const threshold of THRESHOLDS) {
        if (percent >= threshold && !fired.current.has(threshold)) {
          fired.current.add(threshold);
          posthog.capture("scroll_depth", {
            depth_percent: threshold,
            max_depth_px: Math.round(scrollTop),
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [posthog, pathname]);
}
