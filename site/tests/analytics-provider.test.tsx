// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PostHogProvider } from "@/lib/analytics/posthog-provider";

const mock = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn() }));
vi.mock("posthog-js", () => ({ default: mock }));
vi.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
  usePostHog: () => mock,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/analytics/phone-tracker", () => ({ PhoneTracker: () => null }));
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.localStorage.clear();
  window.history.replaceState(null, "", "/?bftp_analytics=on");
  mock.init.mockReset(); mock.capture.mockReset();
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.querySelector("#root")!);
});
afterEach(async () => { await act(async () => root.unmount()); vi.unstubAllGlobals(); });

it("does not initialize tracking or replay in explicit QA mode while keeping content", async () => {
  window.history.replaceState(null, "", "/?bftp_analytics=off");
  await act(async () => root.render(<PostHogProvider publicKey="fixture">Website</PostHogProvider>));
  expect(mock.init).not.toHaveBeenCalled();
  expect(document.body.textContent).toBe("Website");
});

it("keeps normal tracking and filters subsequent QA events at the SDK boundary", async () => {
  await act(async () => root.render(<PostHogProvider publicKey="fixture">Website</PostHogProvider>));
  const config = mock.init.mock.calls[0][1];
  const event = { event: "$autocapture" };
  expect(config.before_send(event)).toBe(event);
  window.history.replaceState(null, "", "/?bftp_analytics=off");
  expect(config.before_send(event)).toBeNull();
});
