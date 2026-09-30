"use client";

import { useEffect } from "react";
import { recordFirstTouch } from "@/lib/lead-attribution";

export function FirstTouch() {
  useEffect(() => {
    recordFirstTouch(window.location, document.referrer);
  }, []);
  return null;
}
