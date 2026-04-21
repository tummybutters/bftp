"use client";

import { useScrollDepth } from "@/lib/analytics/use-scroll-depth";

export function ScrollDepthTracker() {
  useScrollDepth();
  return null;
}
