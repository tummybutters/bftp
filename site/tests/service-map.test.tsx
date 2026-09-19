// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceMap } from "@/components/contact/service-map";
import { emptyAddress, type ServiceAddress } from "@/lib/contact-intake";

type Handler = (...args: unknown[]) => void;

class FakeMap {
  static instances: FakeMap[] = [];
  private handlers = new Map<string, Handler>();
  private styleLoaded = false;

  constructor() {
    FakeMap.instances.push(this);
  }

  addControl() {
    return this;
  }

  on(name: string, handler: Handler) {
    this.handlers.set(name, handler);
    return this;
  }

  isStyleLoaded() {
    return this.styleLoaded;
  }

  emit(name: string, payload?: unknown) {
    this.handlers.get(name)?.(payload);
  }

  emitLoad() {
    this.styleLoaded = true;
    this.emit("load");
  }

  jumpTo() {}

  flyTo() {}

  remove() {}
}

class FakeAttributionControl {}

class FakeMarker {
  setLngLat() {
    return this;
  }

  addTo() {
    return this;
  }

  remove() {}
}

const mock = vi.hoisted(() => ({
  configured: true,
  loadMap: vi.fn(),
}));

vi.mock("@/lib/contact-maps", () => ({
  get mapsConfigured() {
    return mock.configured;
  },
  mapboxToken: "fixture-token",
  loadMap: () => mock.loadMap(),
}));

let root: Root;
let node: HTMLDivElement;
const address: ServiceAddress = { ...emptyAddress };

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  FakeMap.instances = [];
  mock.configured = true;
  mock.loadMap.mockReset();
  mock.loadMap.mockResolvedValue({
    default: {
      Map: FakeMap,
      AttributionControl: FakeAttributionControl,
      Marker: FakeMarker,
    },
  });
  node = document.createElement("div");
  document.body.appendChild(node);
  root = createRoot(node);
});

afterEach(async () => {
  await act(async () => root.unmount());
  node.remove();
  vi.unstubAllGlobals();
});

async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("ServiceMap failure measurement", () => {
  it("reports an SDK failure once without forwarding its message", async () => {
    const onEvent = vi.fn();
    const secret =
      "https://api.mapbox.com/styles/v1/fixture?access_token=secret-token 100 Main St";
    mock.loadMap.mockRejectedValueOnce(new Error(secret));

    await act(async () =>
      root.render(<ServiceMap address={address} onEvent={onEvent} />),
    );
    await settle();

    expect(onEvent).toHaveBeenCalledOnce();
    expect(onEvent).toHaveBeenCalledWith("contact_map_failed", {
      failure_category: "sdk_load",
    });
    expect(node.textContent).toContain("You can keep going without the map.");
    expect(JSON.stringify(onEvent.mock.calls)).not.toContain(secret);
  });

  it("reports repeated style errors once and keeps the fallback usable", async () => {
    const onEvent = vi.fn();
    const secret =
      "https://api.mapbox.com/tiles?access_token=secret-token 200 Main St";

    await act(async () =>
      root.render(<ServiceMap address={address} onEvent={onEvent} />),
    );
    await settle();
    const map = FakeMap.instances[0];
    expect(map).toBeDefined();

    await act(async () => {
      map.emit("error", { error: new Error(secret) });
      map.emit("error", { error: new Error(secret) });
    });

    expect(onEvent).toHaveBeenCalledOnce();
    expect(onEvent).toHaveBeenCalledWith("contact_map_failed", {
      failure_category: "style_load",
    });
    expect(node.textContent).toContain("You can keep going without the map.");
    expect(JSON.stringify(onEvent.mock.calls)).not.toContain(secret);
  });

  it("reports missing configuration as a bounded category and leaves the flow available", async () => {
    const onEvent = vi.fn();
    mock.configured = false;

    await act(async () =>
      root.render(<ServiceMap address={address} onEvent={onEvent} />),
    );
    await settle();

    expect(mock.loadMap).not.toHaveBeenCalled();
    expect(onEvent).toHaveBeenCalledOnce();
    expect(onEvent).toHaveBeenCalledWith("contact_map_failed", {
      failure_category: "not_configured",
    });
    expect(node.textContent).toContain("You can keep going without the map.");
  });
});
