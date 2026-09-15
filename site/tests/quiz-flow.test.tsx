// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element -- DOM-only image stub for the quiz state tests. */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { ContactQuiz } from "@/components/contact/contact-quiz";
import type { ServiceAddress } from "@/lib/contact-intake";
const mock = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock("posthog-js/react", () => ({ usePostHog: () => mock }));
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
  await click("This week");
  await tick();
  expect(node.querySelector("h1")?.textContent).toBe("How can we reach you?");
  expect(node.textContent).not.toContain("Size, make");
});
