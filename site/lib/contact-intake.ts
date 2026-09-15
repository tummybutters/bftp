export const INTAKE_VARIANT = "address_first_v2";
export interface ServiceAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  county: string;
  formatted: string;
  placeId: string;
  source: "places" | "manual";
  lat?: number;
  lng?: number;
}
export const emptyAddress: ServiceAddress = {
  street: "",
  city: "",
  state: "CA",
  postalCode: "",
  county: "",
  formatted: "",
  placeId: "",
  source: "manual",
};
export function addressFromPlace(
  place: google.maps.places.Place,
): ServiceAddress {
  const part = (type: string, short = false) => {
    const c = place.addressComponents?.find((c) => c.types.includes(type));
    return (short ? c?.shortText : c?.longText) || "";
  };
  return {
    street: [part("street_number"), part("route")].filter(Boolean).join(" "),
    city:
      part("locality") || part("postal_town") || part("sublocality_level_1"),
    state: part("administrative_area_level_1", true),
    postalCode: part("postal_code"),
    county: part("administrative_area_level_2"),
    formatted: place.formattedAddress || "",
    placeId: place.id,
    source: "places",
    lat: place.location?.lat(),
    lng: place.location?.lng(),
  };
}
export function addressIsComplete(address: ServiceAddress) {
  return Boolean(
    address.street.trim() &&
    address.city.trim() &&
    /^[A-Z]{2}$/i.test(address.state) &&
    /^\d{5}(-\d{4})?$/.test(address.postalCode),
  );
}
export const serviceOptions = [
  ["Testing", "Testing"],
  ["Repair / Replacement", "Repair"],
  ["New Installation", "Installation"],
  ["Not Sure Yet", "Not sure"],
] as const;
export const propertyOptions = [
  ["Commercial / Business", "Business"],
  ["Apartment/Multi-Family", "Apartments / HOA"],
  ["Residential", "Home"],
  ["Industrial", "Industrial"],
] as const;
export const timingOptions = [
  ["ASAP", "As soon as possible"],
  ["This Week", "This week"],
  ["This Month", "This month"],
  ["Just Pricing / Planning", "Just getting a price"],
] as const;
export const titles = [
  "Where do you need service?",
  "What can we help with?",
  "What kind of property?",
  "When do you need us?",
  "How can we reach you?",
];
