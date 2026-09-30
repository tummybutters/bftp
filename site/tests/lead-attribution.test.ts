import { describe, expect, it } from "vitest";
import { cleanReferralCode, readAttribution, recordFirstTouch } from "@/lib/lead-attribution";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  };
}
const at = (href: string) => {
  const url = new URL(href);
  return { href, search: url.search, hostname: url.hostname };
};

describe("first-touch attribution", () => {
  it("keeps the landing page and outside referrer from the first visit", () => {
    const storage = memoryStorage();
    recordFirstTouch(at("https://www.backflowtestpros.com/blog/rp-testing?utm_source=google"), "https://www.google.com/", storage);
    recordFirstTouch(at("https://www.backflowtestpros.com/contact-backflowtestpros"), "https://www.backflowtestpros.com/blog/rp-testing", storage);
    expect(readAttribution(storage)).toEqual({
      landingUrl: "https://www.backflowtestpros.com/blog/rp-testing?utm_source=google",
      cameFrom: "https://www.google.com/",
      referredBy: "",
    });
  });
  it("picks up a ?ref= link on any visit", () => {
    const storage = memoryStorage();
    recordFirstTouch(at("https://www.backflowtestpros.com/"), "", storage);
    recordFirstTouch(at("https://www.backflowtestpros.com/?ref=km-property"), "", storage);
    expect(readAttribution(storage).referredBy).toBe("Km Property");
    recordFirstTouch(at("https://www.backflowtestpros.com/?ref=KM-Property"), "", storage);
    expect(readAttribution(storage).referredBy).toBe("KM Property");
  });
  it("ignores same-site referrers and survives missing storage", () => {
    const storage = memoryStorage();
    recordFirstTouch(at("https://www.backflowtestpros.com/"), "https://www.backflowtestpros.com/x", storage);
    expect(readAttribution(storage).cameFrom).toBe("");
    expect(() => recordFirstTouch(at("https://www.backflowtestpros.com/"), "", undefined)).not.toThrow();
    expect(readAttribution(undefined)).toEqual({ landingUrl: "", cameFrom: "", referredBy: "" });
  });
  it("cleans referral text", () => {
    expect(cleanReferralCode("Jane_Smith<script>")).toBe("Jane Smithscript");
    expect(cleanReferralCode("O'Neil & Sons")).toBe("O'Neil & Sons");
  });
});
