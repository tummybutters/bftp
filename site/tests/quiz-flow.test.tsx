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
  window.history.replaceState({}, "", "/contact-backflowtestpros");
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
it("tracks the initial service step once when analytics becomes ready", async () => {
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
      expect.objectContaining({ step: 1, step_name: "service", question_order: "service_property_address" }),
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
  await click("Testing");
  await click("Home");
  await click("Select fixture address");
  await click("Edit address");
  await tick(600);
  expect(node.querySelector("h1")?.textContent).toBe(
    "Where do you need service?",
  );
});
it("the chosen service survives back navigation and changes never skip a question", async () => {
  await act(async () => root.render(<ContactQuiz />));
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
  expect(node.querySelector("h1")?.textContent).toBe("Where do you need service?");
  await click("Select fixture address");
  await tick(600);
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
  await click("Testing");
  await click("Home");
  await click("Select fixture address");
  await tick(600);
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

it("joins an accepted form event to its receipt without exposing contact fields", async () => {
  const id = "82615aaa-f269-47e4-8dc0-af367a94a18f";
  const gtag = vi.fn();
  vi.stubGlobal("gtag", gtag);
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ ok: true, submissionId: id })));
  await act(async () => root.render(<ContactQuiz />));
  await click("Repair");
  await click("Home");
  await click("Select fixture address");
  await tick(600);
  await click("This week");
  for (const [selector, value] of [
    ["input[autocomplete=name]", "QA Example"],
    ["input[type=email]", "qa@example.invalid"],
    ["input[type=tel]", "2025550108"],
  ]) {
    await act(async () => {
      const input = node.querySelector<HTMLInputElement>(selector)!;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!
        .set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  await act(async () =>
    node.querySelector("form")!.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    ),
  );
  const [, properties] = mock.capture.mock.calls.find(
    ([event]) => event === "form_submit_succeeded",
  )!;
  expect(properties).toMatchObject({ submission_id: id, service_type: "Repair / Replacement" });
  expect(JSON.stringify(properties)).not.toContain("qa@example.invalid");
  expect(gtag).toHaveBeenCalledWith("event", "form_submit_succeeded", properties);
});


it.each(["Testing", "Repair / Replacement", "New Installation", "Not Sure Yet"])(
  "starts with property for homepage %s and still asks for the address",
  async (service) => {
    window.history.replaceState({}, "", `?service=${encodeURIComponent(service)}`);
    await act(async () => root.render(<ContactQuiz />));
    expect(node.querySelector("h1")?.textContent).toBe("What kind of property?");
    expect(mock.capture).toHaveBeenCalledWith("contact_quiz_step_viewed", expect.objectContaining({
      step: 2, step_name: "property",
    }));
    expect(node.textContent).not.toContain("Select fixture address");
    await click("Home");
    expect(node.querySelector("h1")?.textContent).toBe("Where do you need service?");
    expect(mock.capture).toHaveBeenCalledWith("contact_quiz_step_viewed", expect.objectContaining({
      step: 3, step_name: "address",
    }));
    await click("Select fixture address");
    await tick(600);
    expect(node.querySelector("h1")?.textContent).toBe(
      service === "Testing" ? "How many backflow devices?" : "When do you need us?",
    );
    await act(async () => node.querySelector<HTMLButtonElement>('[aria-label="Go back"]')!.click());
    expect(node.querySelector("h1")?.textContent).toBe("Where do you need service?");
    await act(async () => node.querySelector<HTMLButtonElement>('[aria-label="Go back"]')!.click());
    expect(node.querySelector("h1")?.textContent).toBe("What kind of property?");
    expect([...node.querySelectorAll("button")].find(b => b.textContent === "Home")?.getAttribute("aria-pressed")).toBe("true");
  },
);

it("can change a carried service and preserves answers when editing the address", async () => {
  window.history.replaceState({}, "", "?service=Repair%20%2F%20Replacement");
  await act(async () => root.render(<ContactQuiz />));
  await click("Change");
  expect(node.querySelector("h1")?.textContent).toBe("What can we help with?");
  await click("Testing");
  await click("Home");
  await click("Select fixture address");
  await tick(600);
  await click("Continue");
  await click("This week");
  expect(node.querySelector("h1")?.textContent).toBe("How can we reach you?");
  await click("100 Test Avenue, Los Angeles, CA 90012Change");
  expect(node.querySelector("h1")?.textContent).toBe("Where do you need service?");
  await click("Select fixture address");
  await tick(600);
  expect(node.querySelector<HTMLInputElement>('input[value="Not sure"]')?.checked).toBe(true);
  await click("Continue");
  expect([...node.querySelectorAll("button")].find(b => b.textContent === "This week")?.getAttribute("aria-pressed")).toBe("true");
});
