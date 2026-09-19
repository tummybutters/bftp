// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

it("keeps normal visitors measurable", async () => {
  const { isAnalyticsExcluded } = await import("@/lib/analytics/traffic-mode");
  expect(isAnalyticsExcluded()).toBe(false);
});

it("persists explicit QA exclusion across navigation and reload", async () => {
  window.history.replaceState(null, "", "/?bftp_analytics=off");
  let mode = await import("@/lib/analytics/traffic-mode");
  expect(mode.isAnalyticsExcluded()).toBe(true);
  window.history.replaceState(null, "", "/contact-backflowtestpros");
  vi.resetModules();
  mode = await import("@/lib/analytics/traffic-mode");
  expect(mode.isAnalyticsExcluded()).toBe(true);
  window.history.replaceState(null, "", "/?bftp_analytics=on");
  expect(mode.isAnalyticsExcluded()).toBe(false);
  expect(window.localStorage.getItem("bftp.analytics.excluded")).toBeNull();
});

it("honors the current-page opt-out even when storage is blocked", async () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  window.history.replaceState(null, "", "/?bftp_analytics=off");
  const { isAnalyticsExcluded } = await import("@/lib/analytics/traffic-mode");
  expect(isAnalyticsExcluded()).toBe(true);
  window.history.replaceState(null, "", "/contact-backflowtestpros");
  expect(isAnalyticsExcluded()).toBe(true);
});

it("blocks both custom analytics transports during QA", async () => {
  window.history.replaceState(null, "", "/?bftp_analytics=off");
  const capture = vi.fn(), gtag = vi.fn();
  window.gtag = gtag;
  const { safeCapture } = await import("@/lib/analytics/safe-capture");
  safeCapture({ capture } as never, "form_submitted");
  expect(capture).not.toHaveBeenCalled();
  expect(gtag).not.toHaveBeenCalled();
  delete window.gtag;
});
