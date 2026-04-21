import type { ReactNode } from "react";

import { ScrollDepthTracker } from "@/components/chrome/scroll-depth-tracker";
import { SiteFooter } from "@/components/chrome/site-footer";
import { SiteHeader } from "@/components/chrome/site-header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="bftp-page min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <ScrollDepthTracker />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
