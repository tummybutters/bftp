// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element -- DOM-only image stub for the quiz state tests. */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { ContactQuiz } from "@/components/contact/contact-quiz";
import type { ServiceAddress } from "@/lib/contact-intake";
const mock = vi.hoisted(() => ({ capture: vi.fn(), analyticsReady: true }));
vi.mock("posthog-js/react", () => ({ usePostHog: () => mock }));
vi.mock("@/lib/analytics/posthog-provider", () => ({
  useAnalyticsReady: () => mock.analyticsReady,
}));
vi.mock("next/link", () => ({
  default: (p: React.ComponentProps<"a">) => <a {...p} />,
}));
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={src} />
  ),
}));
vi.mock("@/components/contact/service-map", () => ({ ServiceMap: () => null }));
vi.mock("@/components/contact/address-search", () => ({
  AddressSearch: ({
    value,
    onChange,
    onSelect,
  }: {
    value: ServiceAddress;
    onChange: (a: ServiceAddress) => void;
    onSelect: (a: ServiceAddress) => void;
  }) => (
    <>
      <button
        onClick={() =>
          onSelect({
            ...value,
            street: "100 Test Avenue",
            city: "Los Angeles",
            state: "CA",
            postalCode: "90012",
            formatted: "100 Test Avenue, Los Angeles, CA 90012",
            source: "places",
          })
        }
      >
        Select fixture address
      </button>
      <button
        onClick={() =>
          onChange({
            ...value,
            formatted: "",
            placeId: "",
            source: "manual",
            street: "New edit",
          })
        }
      >
        Edit address
      </button>
    </>
  ),
}));
let root: Root;
let node: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mock.analyticsReady = true;
  mock.capture.mockReset();
  vi.stubGlobal("requestAnimationFrame", (f: () => void) => {
    f();
    return 0;
  });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.useFakeTimers();
  node = document.createElement("div");
  document.body.appendChild(node);
  root = createRoot(node);
});
afterEach(async () => {
  await act(async () => root.unmount());
  node.remove();
  mock.analyticsReady = true;
  mock.capture.mockReset();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
async function click(text: string) {
  const button = [...node.querySelectorAll("button")].find(
    (b) => b.textContent === text,
  )!;
  expect(button).toBeTruthy();
  await act(async () => button.click());
}
async function tick(ms = 200) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}
it("tracks the initial address step once when analytics becomes ready", async () => {
  mock.analyticsReady = false;
  await act(async () => root.render(<ContactQuiz />));
  expect(
    mock.capture.mock.calls.filter(
      ([event]) => event === "contact_quiz_step_viewed",
    ),
  ).toHaveLength(0);

  mock.analyticsReady = true;
  await act(async () => root.render(<ContactQuiz />));
  const stepViews = mock.capture.mock.calls.filter(
    ([event]) => event === "contact_quiz_step_viewed",
  );
  expect(stepViews).toEqual([
    [
      "contact_quiz_step_viewed",
      expect.objectContaining({ step: 1, step_name: "address" }),
    ],
  ]);
  expect(
    mock.capture.mock.calls.filter(([event]) => event === "contact_quiz_viewed"),
  ).toHaveLength(1);

  await act(async () => root.render(<ContactQuiz />));
  expect(
    mock.capture.mock.calls.filter(
      ([event]) => event === "contact_quiz_step_viewed",
    ),
  ).toHaveLength(1);
});

it("editing during the map pause cancels automatic advancement", async () => {
  await act(async () => root.render(<ContactQuiz />));
  await click("Select fixture address");
  await click("Edit address");
  await tick(600);
  expect(node.querySelector("h1")?.textContent).toBe(
    "Where do you need service?",
  );
});
it("the chosen service survives back navigation and changes never skip a question", async () => {
  await act(async () => root.render(<ContactQuiz />));
  await click("Select fixture address");
  await tick(600);
  await click("Repair");
  await tick();
  expect(node.querySelector("h1")?.textContent).toBe("What kind of property?");
  await act(async () =>
    node.querySelector<HTMLButtonElement>('[aria-label="Go back"]')!.click(),
  );
  expect(
    [...node.querySelectorAll("button")]
      .find((b) => b.textContent === "Repair")
      ?.getAttribute("aria-pressed"),
  ).toBe("true");
  await click("Testing");
  await tick();
  await click("Home");
  await tick();
  expect(node.querySelector("h1")?.textContent).toBe(
    "How many backflow devices?",
  );
  await click("Continue");
  await click("This week");
  await tick();
  expect(node.querySelector("h1")?.textContent).toBe("How can we reach you?");
  expect(node.textContent).not.toContain("Size, make");
});

it("keeps a failed request editable, then accepts a retry even when analytics throws", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ error: "Please try again." }, { status: 503 }),
    )
    .mockResolvedValueOnce(Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetch);
  mock.capture.mockImplementation(() => {
    throw Error("analytics offline");
  });
  await act(async () => root.render(<ContactQuiz />));
  await click("Select fixture address");
  await tick(600);
  await click("Testing");
  await click("Home");
  await click("Continue");
  await click("This week");
  for (const [selector, value] of [
    ["input[autocomplete=name]", "QA"],
    ["input[type=email]", "qa@example.invalid"],
    ["input[type=tel]", "2025550108"],
  ]) {
    await act(async () => {
      const input = node.querySelector(selector)!;
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  await act(async () =>
    node
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(node.querySelector('[role="alert"]')).toBeTruthy();
  expect(
    node.querySelector<HTMLInputElement>("input[autocomplete=name]")!.value,
  ).toBe("QA");
  expect(node.textContent).not.toContain("Your repair credit");
  await act(async () =>
    node
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(node.textContent).toContain("You’re in good hands.");
  const body = fetch.mock.calls[1][1].body as FormData;
  expect(body.get("testing_count")).toBe("Not Sure");
  expect(body.get("first_name")).toBe("QA");
  mock.capture.mockReset();
});
