"use client";

import { usePostHog } from "posthog-js/react";
import type { ReactNode } from "react";

export function TrackedHeroDetails({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const posthog = usePostHog();

  return (
    <details
      className={className}
      onToggle={(e) => {
        const open = (e.target as HTMLDetailsElement).open;
        posthog?.capture("hero_read_more_toggled", { action: open ? "open" : "close" });
      }}
    >
      {children}
    </details>
  );
}
