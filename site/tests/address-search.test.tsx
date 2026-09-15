// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AddressSearch } from "@/components/contact/address-search";
import { emptyAddress } from "@/lib/contact-intake";
const mock = vi.hoisted(() => ({ search: vi.fn(), configured: true }));
vi.mock("@/lib/contact-maps", () => ({
  get mapsConfigured() {
    return mock.configured;
  },
  loadPlaces: async () => ({
    AutocompleteSuggestion: { fetchAutocompleteSuggestions: mock.search },
    AutocompleteSessionToken: class {},
  }),
}));
let root: Root;
let node: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers();
  mock.search.mockReset();
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
  placeId: text,
  mainText: { toString: () => text },
  text: { toString: () => text },
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
      suggestions: [{ placePrediction: prediction("New address") }],
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
  await act(async () =>
    old({ suggestions: [{ placePrediction: prediction("Stale address") }] }),
  );
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
  expect(node.textContent).toContain("Address search is unavailable");
  const button = [...node.querySelectorAll("button")].find(
    (n) => n.textContent === "Enter address manually",
  )!;
  await act(async () => button.click());
  expect(node.textContent).toContain("ZIP code");
  expect(node.textContent).toContain("Continue");
});
it("keyboard selection fetches address fields and advances only after a complete result", async () => {
  const selected = vi.fn();
  const fetchFields = vi.fn(async () => {});
  const place = {
    id: "place-1",
    formattedAddress: "100 Test Avenue, Los Angeles, CA 90012",
    fetchFields,
    location: { lat: () => 34, lng: () => -118 },
    addressComponents: [
      ["street_number", "100"],
      ["route", "Test Avenue"],
      ["locality", "Los Angeles"],
      ["administrative_area_level_1", "California", "CA"],
      ["postal_code", "90012"],
    ].map(([type, longText, shortText]) => ({
      types: [type],
      longText,
      shortText: shortText || longText,
    })),
  };
  mock.search.mockResolvedValue({
    suggestions: [
      {
        placePrediction: {
          ...prediction("100 Test Avenue"),
          toPlace: () => place,
        },
      },
    ],
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
  expect(fetchFields).toHaveBeenCalledOnce();
  expect(selected.mock.lastCall?.[0]).toMatchObject({
    street: "100 Test Avenue",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90012",
    source: "places",
  });
});
it("explains a missing Maps configuration without trapping the customer", async () => {
  mock.configured = false;
  await act(async () => root.render(<AddressSearch value={emptyAddress} onChange={vi.fn()} onSelect={vi.fn()} onStart={vi.fn()} />));
  await type("100 Test");
  expect(node.textContent).toContain("Address search is unavailable");
  expect(node.textContent).toContain("Enter address manually");
  expect(mock.search).not.toHaveBeenCalled();
});
