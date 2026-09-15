import type { PostHog } from "posthog-js";
export function safeCapture(
  client: Pick<PostHog, "capture"> | undefined | null,
  event: string,
  properties: Record<string, string | number | boolean | undefined> = {},
) {
  try {
    client?.capture(event, properties);
  } catch {
    /* Measurement cannot block a form or link. */
  }
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    try {
      window.gtag("event", event, properties);
    } catch {
      /* Same guarantee for GA. */
    }
  }
}
