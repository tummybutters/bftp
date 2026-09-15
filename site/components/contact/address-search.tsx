"use client";
import { useEffect, useRef, useState } from "react";
import {
  MapPinIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type {
  AddressAutofillCore,
  AddressAutofillSuggestion,
  SessionToken,
} from "@mapbox/search-js-core";
import {
  addressIsComplete,
  emptyAddress,
  type ServiceAddress,
} from "@/lib/contact-intake";
import { loadSearch, mapboxToken, mapsConfigured } from "@/lib/contact-maps";
import s from "./contact-quiz.module.css";
const cx = (...names: string[]) => names.map((n) => s[n] || n).join(" ");
type Props = {
  value: ServiceAddress;
  onChange: (v: ServiceAddress) => void;
  onSelect: (v: ServiceAddress) => void;
  onStart: () => void;
  onEvent?: (
    name: string,
    properties?: Record<string, string | number | boolean>,
  ) => void;
};
export function AddressSearch({
  value,
  onChange,
  onSelect,
  onStart,
  onEvent,
}: Props) {
  const [query, setQuery] = useState(value.formatted || value.street),
    [manual, setManual] = useState(false),
    [results, setResults] = useState<AddressAutofillSuggestion[]>([]),
    [active, setActive] = useState(-1),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const seq = useRef(0),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    searchClient = useRef<AddressAutofillCore | null>(null),
    session = useRef<SessionToken | null>(null),
    input = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      seq.current++;
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const emit = (
    name: string,
    props: Record<string, string | number | boolean> = {},
  ) => onEvent?.(name, props);
  async function search(text: string) {
    setQuery(text);
    setActive(-1);
    setResults([]);
    setNotice("");
    onStart();
    onChange({ ...emptyAddress, street: text });
    const id = ++seq.current;
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 3 || !mapsConfigured) {
      setBusy(false);
      if (!mapsConfigured && text.length >= 3)
        setNotice(
          "Search is unavailable. You can enter your address manually.",
        );
      return;
    }
    setBusy(true);
    timer.current = setTimeout(async () => {
      try {
        const sdk = await loadSearch();
        if (seq.current !== id) return;
        searchClient.current ||= new sdk.AddressAutofillCore({
          accessToken: mapboxToken,
          country: "us",
          proximity: [-118.05, 33.85],
          limit: 5,
          streets: false,
        });
        session.current ||= new sdk.SessionToken();
        const result = await searchClient.current.suggest(text, {
          sessionToken: session.current,
        });
        if (seq.current !== id) return;
        setResults(result.suggestions);
        emit("contact_address_suggestions", {
          result_count: result.suggestions.length,
        });
        if (!result.suggestions.length)
          setNotice("No match yet. Try adding your city.");
      } catch {
        if (seq.current === id) {
          setNotice(
            "Search is unavailable. You can enter your address manually.",
          );
          emit("contact_address_search_failed");
        }
      } finally {
        if (seq.current === id) setBusy(false);
      }
    }, 220);
  }
  async function select(item: AddressAutofillSuggestion) {
    const id = ++seq.current;
    setBusy(true);
    setResults([]);
    setNotice("");
    try {
      if (!searchClient.current || !session.current)
        throw Error("Search session missing");
      const data = await searchClient.current.retrieve(item, {
        sessionToken: session.current,
      });
      if (seq.current !== id) return;
      session.current = null;
      const feature = data.features[0];
      if (!feature) throw Error("Address missing");
      const p = { ...item, ...feature.properties };
      const state = String(p.address_level1 || "").replace(
        /^California$/i,
        "CA",
      );
      const next: ServiceAddress = {
        ...emptyAddress,
        street: String(p.address_line1 || p.feature_name || ""),
        city: String(p.address_level2 || ""),
        state,
        postalCode: String(p.postcode || ""),
        formatted: String(p.full_address || item.full_address || ""),
        source: "mapbox",
        placeId: "",
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
      };
      // Coordinates and provider IDs stay ephemeral. Only the customer's selected postal fields go into intake.
      onChange(next);
      setQuery(next.formatted || next.street);
      if (addressIsComplete(next)) onSelect(next);
      else {
        setManual(true);
        setNotice("Add the missing address details to continue.");
        emit("contact_address_incomplete");
      }
    } catch {
      if (seq.current === id) {
        setNotice(
          "We couldn’t load that address. Try again or enter it manually.",
        );
        emit("contact_address_retrieve_failed");
      }
    } finally {
      if (seq.current === id) setBusy(false);
    }
  }
  function openManual() {
    seq.current++;
    if (timer.current) clearTimeout(timer.current);
    setBusy(false);
    setResults([]);
    session.current = null;
    setManual(true);
    setNotice("");
    onStart();
    emit("contact_address_manual_opened");
  }
  function edit(patch: Partial<ServiceAddress>) {
    onChange({
      ...value,
      ...patch,
      source: "manual",
      formatted: "",
      placeId: "",
      lat: undefined,
      lng: undefined,
    });
  }
  function continueSearch() {
    if (busy) return;
    if (active >= 0 && results[active]) void select(results[active]);
    else if (results.length === 1) void select(results[0]);
    else if (addressIsComplete(value) && value.formatted) onSelect(value);
    else {
      input.current?.focus();
      setNotice(
        results.length
          ? "Choose your address from the suggestions."
          : "Start typing your address, or enter it manually.",
      );
    }
  }
  return (
    <div className="ph-no-capture" data-ph-no-capture>
      {manual ? (
        <div className={cx("manual")}>
          <label>
            Street address
            <input
              autoComplete="street-address"
              maxLength={200}
              value={value.street}
              onChange={(e) => edit({ street: e.target.value })}
            />
          </label>
          <div className={cx("manual-row")}>
            <label>
              City
              <input
                autoComplete="address-level2"
                maxLength={100}
                value={value.city}
                onChange={(e) => edit({ city: e.target.value })}
              />
            </label>
            <label>
              State
              <input
                autoComplete="address-level1"
                maxLength={2}
                value={value.state}
                onChange={(e) => edit({ state: e.target.value.toUpperCase() })}
              />
            </label>
            <label>
              ZIP code
              <input
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={10}
                value={value.postalCode}
                onChange={(e) => edit({ postalCode: e.target.value })}
              />
            </label>
          </div>
          <p role="status" className={cx("error")}>
            {notice}
          </p>
          <button
            type="button"
            className={cx("primary")}
            onClick={() => {
              if (!addressIsComplete(value)) {
                setNotice("Add your street, city, state and ZIP code.");
                return;
              }
              onSelect({
                ...value,
                formatted: `${value.street}, ${value.city}, ${value.state} ${value.postalCode}`,
              });
            }}
          >
            Continue
            <ArrowRightIcon />
          </button>
          <button
            type="button"
            className={cx("text-button")}
            onClick={() => {
              setManual(false);
              setQuery(value.street);
              setNotice("");
            }}
          >
            Search instead
          </button>
        </div>
      ) : (
        <div className={cx("search-area")}>
          <div className={cx("search-box")}>
            <MapPinIcon className={cx("search-pin")} aria-hidden="true" />
            <input
              ref={input}
              aria-label="Service address"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={results.length > 0}
              aria-controls="address-options"
              aria-activedescendant={
                active >= 0 ? `address-option-${active}` : undefined
              }
              placeholder="Start with your street address"
              autoComplete="off"
              maxLength={250}
              value={query}
              onChange={(e) => void search(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && results.length) {
                  e.preventDefault();
                  setActive((a) => (a + 1) % results.length);
                }
                if (e.key === "ArrowUp" && results.length) {
                  e.preventDefault();
                  setActive((a) => (a <= 0 ? results.length - 1 : a - 1));
                }
                if (e.key === "Escape") {
                  seq.current++;
                  setResults([]);
                  setActive(-1);
                  setBusy(false);
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  continueSearch();
                }
              }}
            />
            {query && (
              <button
                type="button"
                className={cx("clear")}
                aria-label="Clear address"
                onClick={() => {
                  void search("");
                  input.current?.focus();
                }}
              >
                <XMarkIcon />
              </button>
            )}
            <button
              type="button"
              className={cx("go")}
              aria-label="Continue with address"
              disabled={busy}
              onClick={continueSearch}
            >
              {busy ? (
                <span className={cx("spinner")} aria-label="Searching" />
              ) : (
                <ArrowRightIcon />
              )}
            </button>
          </div>
          {results.length > 0 && (
            <div
              role="listbox"
              id="address-options"
              aria-label="Matching addresses"
              className={cx("suggestions")}
            >
              {results.map((item, i) => (
                <button
                  key={item.mapbox_id || i}
                  id={`address-option-${i}`}
                  role="option"
                  aria-selected={active === i}
                  tabIndex={-1}
                  type="button"
                  className={active === i ? cx("highlighted") : undefined}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void select(item)}
                >
                  <MapPinIcon />
                  <span>
                    <strong>{item.address_line1 || item.feature_name}</strong>
                    <small>{item.description}</small>
                  </span>
                  <ChevronRightIcon />
                </button>
              ))}
              <div className={cx("search-credit")} role="presentation">
                Search by Mapbox
              </div>
            </div>
          )}
          <div className={cx("search-under")}>
            <span role="status">
              {notice || (busy ? "Finding your address…" : " ")}
            </span>
            <button
              className={cx("text-button")}
              type="button"
              onClick={openManual}
            >
              Enter manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
