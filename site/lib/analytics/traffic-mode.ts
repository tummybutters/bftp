// Explicit browser opt-out for staff/QA. Never infer staff from IP or behavior.
const KEY = "bftp.analytics.excluded";
let excludedForPage: boolean | undefined;

export function isAnalyticsExcluded(): boolean {
  if (typeof window === "undefined") return false;
  const choice = new URLSearchParams(window.location.search).get("bftp_analytics");
  if (choice === "off" || choice === "on") {
    excludedForPage = choice === "off";
    try {
      if (excludedForPage) window.localStorage.setItem(KEY, "1");
      else window.localStorage.removeItem(KEY);
    } catch { /* The current page still honors the choice without storage. */ }
  }
  if (excludedForPage !== undefined) return excludedForPage;
  try { return window.localStorage.getItem(KEY) === "1"; }
  catch { return false; }
}
