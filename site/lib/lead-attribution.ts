// Remembers how a visitor first reached the site (landing page, outside
// referrer, ?ref= referral code) so the contact form can tag the lead.
// Browser storage can be missing or blocked; every access is best effort.

export interface LeadAttribution {
  landingUrl: string;
  cameFrom: string;
  referredBy: string;
}

const STORAGE_KEY = "bftp_first_touch";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredTouch extends LeadAttribution {
  at: number;
}

const empty: LeadAttribution = { landingUrl: "", cameFrom: "", referredBy: "" };

function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function cleanReferralCode(value: string | null | undefined) {
  return (value || "")
    .replace(/[-_+]+/g, " ")
    .replace(/[^\p{L}\p{N} .&']/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function readStored(storage: Storage): StoredTouch | null {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "null");
    if (!parsed || typeof parsed.at !== "number") return null;
    if (Date.now() - parsed.at > MAX_AGE_MS) return null;
    return parsed as StoredTouch;
  } catch {
    return null;
  }
}

export function recordFirstTouch(
  location: Pick<Location, "href" | "search" | "hostname">,
  referrer: string,
  storage: Storage | undefined = browserStorage(),
) {
  if (!storage) return;
  try {
    const slug = cleanReferralCode(new URLSearchParams(location.search).get("ref"));
    // Links are written as ?ref=jane-smith; show them as a name.
    const ref =
      slug === slug.toLowerCase()
        ? slug.replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase())
        : slug;
    const stored = readStored(storage);
    let outside = "";
    try {
      outside = referrer && new URL(referrer).hostname !== location.hostname ? referrer : "";
    } catch {
      outside = "";
    }
    const next: StoredTouch = stored
      ? { ...stored, referredBy: ref || stored.referredBy }
      : {
          landingUrl: location.href.slice(0, 500),
          cameFrom: outside.slice(0, 500),
          referredBy: ref,
          at: Date.now(),
        };
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* Attribution never blocks the page. */
  }
}

export function readAttribution(
  storage: Storage | undefined = browserStorage(),
): LeadAttribution {
  if (!storage) return empty;
  const stored = readStored(storage);
  if (!stored) return empty;
  return {
    landingUrl: stored.landingUrl || "",
    cameFrom: stored.cameFrom || "",
    referredBy: stored.referredBy || "",
  };
}
