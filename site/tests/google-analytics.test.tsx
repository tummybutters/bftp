// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  pathname: "/",
  search: "",
  onReady: undefined as (() => void) | undefined,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useSearchParams: () => new URLSearchParams(state.search),
}));
vi.mock("next/script", () => ({
  default: ({ src, onReady }: { src?: string; onReady?: () => void }) => {
    if (src) state.onReady = onReady;
    return null;
  },
}));

let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-FIXTURE");
  state.pathname = "/";
  state.search = "";
  state.onReady = undefined;
  window.localStorage.clear();
  window.history.replaceState({}, "", "/?bftp_analytics=on");
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.querySelector("#root")!);
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it("sends one first pageview after the tag is ready and one for a new route", async () => {
  const gtag = vi.fn();
  vi.stubGlobal("gtag", gtag);
  const { GoogleAnalytics } = await import("@/lib/analytics/google-analytics");
  await act(async () => root.render(<GoogleAnalytics />));
  expect(gtag).not.toHaveBeenCalled();
  await act(async () => state.onReady?.());
  expect(gtag).toHaveBeenCalledTimes(1);
  expect(gtag).toHaveBeenCalledWith("event", "page_view", expect.objectContaining({
    page_path: "/",
    page_location: `${window.location.origin}/`,
  }));
  await act(async () => root.render(<GoogleAnalytics />));
  expect(gtag).toHaveBeenCalledTimes(1);

  state.pathname = "/contact-backflowtestpros";
  state.search = "utm_source=google&details=private%20notes";
  await act(async () => root.render(<GoogleAnalytics />));
  expect(gtag).toHaveBeenCalledTimes(2);
  expect(gtag.mock.calls[1][2]).toMatchObject({
    page_path: "/contact-backflowtestpros?utm_source=google",
    page_location: `${window.location.origin}/contact-backflowtestpros?utm_source=google`,
  });
});

it("does not load the tag or send a pageview in explicit staff QA mode", async () => {
  window.history.replaceState({}, "", "/?bftp_analytics=off");
  const gtag = vi.fn();
  vi.stubGlobal("gtag", gtag);
  const { GoogleAnalytics } = await import("@/lib/analytics/google-analytics");
  await act(async () => root.render(<GoogleAnalytics />));
  expect(state.onReady).toBeUndefined();
  expect(gtag).not.toHaveBeenCalled();
});
