// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AddressSearch } from "@/components/contact/address-search";
import { emptyAddress } from "@/lib/contact-intake";
const mock = vi.hoisted(() => ({
  search: vi.fn(),
  retrieve: vi.fn(),
  configured: true,
}));
vi.mock("@/lib/contact-maps", () => ({
  get mapsConfigured() {
    return mock.configured;
  },
  mapboxToken: "fixture",
  loadSearch: async () => ({
    AddressAutofillCore: class {
      suggest = mock.search;
      retrieve = mock.retrieve;
    },
    SessionToken: class {},
  }),
}));
let root: Root;
let node: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers();
  mock.search.mockReset();
  mock.retrieve.mockReset();
  mock.configured = true;
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
const prediction = (text: string) => ({
  mapbox_id: text,
  address_line1: text,
  full_address: text,
  description: "Los Angeles, CA",
});
async function type(text: string) {
  const input = node.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await act(async () => {
    vi.advanceTimersByTime(260);
  });
}
it("ignores late autocomplete results and invalidates the previous selected address", async () => {
  let old!: (value: unknown) => void;
  mock.search
    .mockReturnValueOnce(new Promise((r) => (old = r)))
    .mockResolvedValueOnce({
      suggestions: [prediction("New address")],
    });
  const changed = vi.fn();
  await act(async () =>
    root.render(
      <AddressSearch
        value={{
          ...emptyAddress,
          street: "Old",
          formatted: "Old selected",
          placeId: "old",
          source: "places",
          lat: 34,
          lng: -118,
        }}
        onChange={changed}
        onSelect={vi.fn()}
        onStart={vi.fn()}
      />,
    ),
  );
  await type("Older query");
  await type("New query");
  await act(async () => old({ suggestions: [prediction("Stale address")] }));
  expect(node.textContent).toContain("New address");
  expect(node.textContent).not.toContain("Stale address");
  expect(changed.mock.lastCall?.[0]).toMatchObject({
    placeId: "",
    formatted: "",
    source: "manual",
  });
  expect(changed.mock.lastCall?.[0].lat).toBeUndefined();
});
it("a provider failure leaves manual entry available", async () => {
  mock.search.mockRejectedValue(new Error("test outage"));
  await act(async () =>
    root.render(
      <AddressSearch
        value={emptyAddress}
        onChange={vi.fn()}
        onSelect={vi.fn()}
        onStart={vi.fn()}
      />,
    ),
  );
  await type("100 Test");
  expect(node.textContent).toContain("Search is unavailable");
  const button = [...node.querySelectorAll("button")].find(
    (n) => n.textContent === "Enter manually",
  )!;
  await act(async () => button.click());
  expect(node.textContent).toContain("ZIP code");
  expect(node.textContent).toContain("Continue");
});
it("keyboard selection fetches address fields and advances only after a complete result", async () => {
  const selected = vi.fn();
  mock.retrieve.mockResolvedValue({
    features: [
      {
        geometry: { coordinates: [-118, 34] },
        properties: {
          address_line1: "100 Test Avenue",
          address_level2: "Los Angeles",
          address_level1: "California",
          postcode: "90012",
          full_address: "100 Test Avenue, Los Angeles, CA 90012",
        },
      },
    ],
  });
  mock.search.mockResolvedValue({
    suggestions: [prediction("100 Test Avenue")],
  });
  await act(async () =>
    root.render(
      <AddressSearch
        value={emptyAddress}
        onChange={vi.fn()}
        onSelect={selected}
        onStart={vi.fn()}
      />,
    ),
  );
  await type("100 Test");
  await act(async () =>
    node
      .querySelector("input")!
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      ),
  );
  await act(async () =>
    node
      .querySelector("input")!
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      ),
  );
  expect(mock.retrieve).toHaveBeenCalledOnce();
  expect(selected.mock.lastCall?.[0]).toMatchObject({
    street: "100 Test Avenue",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90012",
    source: "mapbox",
  });
});
it("explains a missing Maps configuration without trapping the customer", async () => {
  mock.configured = false;
  await act(async () =>
    root.render(
      <AddressSearch
        value={emptyAddress}
        onChange={vi.fn()}
        onSelect={vi.fn()}
        onStart={vi.fn()}
      />,
    ),
  );
  await type("100 Test");
  expect(node.textContent).toContain("Search is unavailable");
  expect(node.textContent).toContain("Enter manually");
  expect(mock.search).not.toHaveBeenCalled();
});
