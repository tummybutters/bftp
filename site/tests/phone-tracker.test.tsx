// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PhoneTracker } from "@/lib/analytics/phone-tracker";
import { TrackedLink } from "@/lib/analytics/tracked-link";
import { TrackedHeroCta } from "@/components/sections/tracked-hero-cta";
const mock = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock("posthog-js/react", () => ({ usePostHog: () => mock }));
vi.mock("next/link", () => ({
  default: (props: React.ComponentProps<"a">) => <a {...props} />,
}));
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  document.body.innerHTML = '<div id="app"></div>';
  root = createRoot(document.querySelector("#app")!);
  mock.capture.mockClear();
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});
it("counts tracked, hero, content, and keyboard-activated telephone links exactly once without PII", async () => {
  await act(async () =>
    root.render(
      <>
        <PhoneTracker />
        <TrackedLink
          href="tel:18008036658"
          event="phone_cta_clicked"
          properties={{ location: "header" }}
        >
          Call
        </TrackedLink>
        <TrackedHeroCta
          href="tel:13107537325"
          label="Call LA"
          className="hero"
        />
        <a href="tel:16194156937">Call SD</a>
        <a href="tel:12025550108">Customer number must not be tracked</a>
      </>,
    ),
  );
  document.addEventListener("click", (e) => e.preventDefault(), {
    once: false,
  });
  for (const link of document.querySelectorAll("a")) link.click();
  expect(
    mock.capture.mock.calls.filter(([event]) => event === "phone_cta_clicked"),
  ).toHaveLength(3);
  expect(mock.capture.mock.calls.map(([, p]) => p.office)).toEqual([
    "main",
    "los_angeles",
    "san_diego",
  ]);
  expect(JSON.stringify(mock.capture.mock.calls)).not.toContain("2025550108");
});
it("cleans up the document listener on remount", async () => {
  await act(async () => root.render(<PhoneTracker />));
  await act(async () => root.render(<></>));
  await act(async () =>
    root.render(
      <>
        <PhoneTracker />
        <a href="tel:18008036658">Call</a>
      </>,
    ),
  );
  document.querySelector("a")!.click();
  expect(mock.capture).toHaveBeenCalledTimes(1);
});
