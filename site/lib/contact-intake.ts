export const INTAKE_VARIANT = "address_centered_v3";
export interface ServiceAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  county: string;
  formatted: string;
  placeId: string;
  source: "places" | "mapbox" | "manual";
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

/** Preserve intent from the existing pricing/service links while still asking for the address first. */
export function contactIntentFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const topic = (params.get("topic") || params.get("service") || "")
    .trim()
    .slice(0, 200);
  const details = (params.get("details") || "").trim().slice(0, 2500);
  const lower = topic.toLowerCase();
  const service = lower.includes("test")
    ? "Testing"
    : lower.includes("repair") || lower.includes("replacement")
      ? "Repair / Replacement"
      : lower.includes("install")
        ? "New Installation"
        : lower.includes("not sure")
          ? "Not Sure Yet"
          : "";
  // `service=` is an answer the visitor already gave (the homepage asks the
  // question); `topic=` is only an offer they clicked, so it pre-selects
  // without skipping the question.
  const serviceAnswered = Boolean(service) && params.has("service");
  const property = lower.includes("residential")
    ? "Residential"
    : lower.includes("commercial")
      ? "Commercial / Business"
      : "";
  return {
    service,
    serviceAnswered,
    property,
    notes: [topic ? `Selected offer: ${topic}` : "", details]
      .filter(Boolean)
      .join("\n"),
  };
}
