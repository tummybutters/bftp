"use client";
import { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  addressFromPlace,
  addressIsComplete,
  type ServiceAddress,
} from "@/lib/contact-intake";
import { loadPlaces, mapsConfigured } from "@/lib/contact-maps";
import s from "./contact-quiz.module.css";

export function AddressSearch({
  value,
  onChange,
  onSelect,
  onStart,
}: {
  value: ServiceAddress;
  onChange: (v: ServiceAddress) => void;
  onSelect: (v: ServiceAddress) => void;
  onStart: () => void;
}) {
  const [query, setQuery] = useState(value.formatted || value.street);
  const [manual, setManual] = useState(false);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.PlacePrediction[]
  >([]);
  const [active, setActive] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const sequence = useRef(0);
  const session = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null,
  );
  useEffect(() => {
    // This is a request generation counter, not a DOM ref. Invalidate late results on unmount.
    const counter = sequence;
    return () => {
      counter.current++;
    };
  }, []);
  const search = (text: string) => {
    setQuery(text);
    setActive(-1);
    setSuggestions([]);
    setNotice("");
    onStart();
    // Editing invalidates the old pin and all address components immediately.
    onChange({
      street: text,
      city: "",
      state: "CA",
      postalCode: "",
      county: "",
      formatted: "",
      placeId: "",
      source: "manual",
    });
    const id = ++sequence.current;
    if (text.trim().length < 3 || !mapsConfigured) {
      if (!mapsConfigured && text.trim().length >= 3) setNotice("Address search is unavailable. You can enter it yourself.");
      setBusy(false);
      return;
    }
    setBusy(true);
    window.setTimeout(async () => {
      if (sequence.current !== id) return;
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } =
          await loadPlaces();
        if (sequence.current !== id) return;
        session.current ||= new AutocompleteSessionToken();
        const result =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: text,
            sessionToken: session.current,
            includedRegionCodes: ["us"],
            locationBias: {
              north: 34.9,
              south: 32.5,
              east: -115.5,
              west: -119.6,
            },
          });
        if (sequence.current !== id) return;
        const matches = result.suggestions.flatMap((item) =>
          item.placePrediction ? [item.placePrediction] : [],
        );
        setSuggestions(matches);
        if (!matches.length)
          setNotice("No matching address yet. You can enter it yourself.");
      } catch {
        if (sequence.current === id)
          setNotice(
            "Address search is unavailable. You can enter it yourself.",
          );
      } finally {
        if (sequence.current === id) setBusy(false);
      }
    }, 250);
  };
  const select = async (prediction: google.maps.places.PlacePrediction) => {
    const id = ++sequence.current;
    setBusy(true);
    setSuggestions([]);
    setQuery(prediction.text.toString());
    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["id", "formattedAddress", "addressComponents", "location"],
      });
      if (sequence.current !== id) return;
      session.current = null;
      const next = addressFromPlace(place);
      onChange(next);
      setQuery(next.formatted);
      if (addressIsComplete(next)) onSelect(next);
      else {
        setManual(true);
        setNotice("Add the missing address details to continue.");
      }
    } catch {
      if (sequence.current === id) {
        setManual(true);
        setNotice("Please confirm the address below.");
      }
    } finally {
      if (sequence.current === id) setBusy(false);
    }
  };
  const openManual = () => {
    sequence.current++;
    session.current = null;
    setBusy(false);
    setSuggestions([]);
    setManual(true);
    onStart();
  };
  const updateManual = (patch: Partial<ServiceAddress>) =>
    onChange({
      ...value,
      ...patch,
      county: "",
      formatted: "",
      placeId: "",
      source: "manual",
      lat: undefined,
      lng: undefined,
    });
  return (
    <div className="ph-no-capture" data-ph-no-capture>
      {!manual ? (
        <>
          <div className={s.search}>
            <MagnifyingGlassIcon aria-hidden="true" />
            <input
              aria-label="Service address"
              autoComplete="off"
              placeholder="Enter your service address"
              value={query}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestions.length > 0}
              aria-controls="address-options"
              aria-activedescendant={
                active >= 0 ? `address-option-${active}` : undefined
              }
              onChange={(e) => search(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && suggestions.length) {
                  e.preventDefault();
                  setActive((v) => (v + 1) % suggestions.length);
                }
                if (e.key === "ArrowUp" && suggestions.length) {
                  e.preventDefault();
                  setActive((v) => (v <= 0 ? suggestions.length - 1 : v - 1));
                }
                if (e.key === "Escape") {
                  sequence.current++;
                  setBusy(false);
                  setSuggestions([]);
                  setActive(-1);
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (active >= 0 && suggestions[active])
                    void select(suggestions[active]);
                  else if (suggestions.length === 1)
                    void select(suggestions[0]);
                  else if (!mapsConfigured) openManual();
                }
              }}
            />
            {busy && <span className={s.spinner} aria-label="Searching" />}
          </div>
          {suggestions.length > 0 && (
            <ul
              id="address-options"
              role="listbox"
              aria-label="Matching addresses"
              className={s.suggestions}
            >
              {suggestions.map((item, index) => (
                <li
                  key={item.placeId}
                  id={`address-option-${index}`}
                  role="option"
                  aria-selected={index === active}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    className={index === active ? s.highlighted : ""}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => void select(item)}
                  >
                    <MapPinIcon aria-hidden="true" />
                    <span>
                      <strong>
                        {item.mainText?.toString() || item.text.toString()}
                      </strong>
                      <small>{item.secondaryText?.toString()}</small>
                    </span>
                    <ChevronRightIcon aria-hidden="true" />
                  </button>
                </li>
              ))}
              <li role="presentation" className={s.googleCredit} translate="no">
                Powered by Google Maps
              </li>
            </ul>
          )}
          <p role="status" className={s.notice}>
            {notice}
          </p>
          <button type="button" className={s.textButton} onClick={openManual}>
            Enter address manually
          </button>
          {value.formatted && addressIsComplete(value) && (
            <button
              className={s.primary}
              type="button"
              onClick={() => onSelect(value)}
            >
              Continue <ChevronRightIcon aria-hidden="true" />
            </button>
          )}
        </>
      ) : (
        <div className={s.manual}>
          <label>
            Street address
            <input
              autoComplete="street-address"
              value={value.street}
              maxLength={200}
              onChange={(e) => updateManual({ street: e.target.value })}
            />
          </label>
          <label>
            City
            <input
              autoComplete="address-level2"
              value={value.city}
              maxLength={100}
              onChange={(e) => updateManual({ city: e.target.value })}
            />
          </label>
          <div className={s.fieldPair}>
            <label>
              State
              <input
                autoComplete="address-level1"
                value={value.state}
                maxLength={2}
                onChange={(e) =>
                  updateManual({ state: e.target.value.toUpperCase() })
                }
              />
            </label>
            <label>
              ZIP code
              <input
                autoComplete="postal-code"
                inputMode="numeric"
                value={value.postalCode}
                maxLength={10}
                onChange={(e) => updateManual({ postalCode: e.target.value })}
              />
            </label>
          </div>
          <p role="status" className={s.notice}>
            {notice}
          </p>
          <button
            type="button"
            className={s.primary}
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
            Continue <ChevronRightIcon aria-hidden="true" />
          </button>
          <button
            type="button"
            className={s.textButton}
            onClick={() => {
              setManual(false);
              setNotice("");
            }}
          >
            Search instead
          </button>
        </div>
      )}
    </div>
  );
}
