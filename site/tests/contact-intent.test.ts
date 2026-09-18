import { describe, expect, it } from "vitest";

import { contactIntentFromSearch, serviceOptions } from "@/lib/contact-intake";

describe("service carried from the homepage", () => {
  it("round-trips every homepage chip, so no tap arrives empty", () => {
    for (const [value] of serviceOptions) {
      const intent = contactIntentFromSearch(`?service=${encodeURIComponent(value)}`);
      expect(intent.service).toBe(value);
      expect(intent.serviceAnswered).toBe(true);
    }
  });

  it("an offer click pre-selects but still asks; junk answers nothing", () => {
    expect(contactIntentFromSearch("?topic=Annual+Testing")).toMatchObject({
      service: "Testing",
      serviceAnswered: false,
    });
    expect(contactIntentFromSearch("?service=zzz").serviceAnswered).toBe(false);
  });
});
