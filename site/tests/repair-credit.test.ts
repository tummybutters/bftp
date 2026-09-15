import { expect, it } from "vitest";
import { POST } from "@/app/api/contact/repair-credit/route";
const request = (body: unknown) =>
  new Request("http://localhost/api/contact/repair-credit", {
    method: "POST",
    body: JSON.stringify(body),
  });
it("returns only repair credit for eligible exact scope, with the $500 cap", async () => {
  for (const [property, device_count, expected] of [
    ["Residential", 1, 10900],
    ["Commercial / Business", 1, 17900],
    ["Commercial / Business", 2, 23800],
    ["Commercial / Business", 5, 50000],
    ["Residential", 12, 50000],
  ]) {
    const res = await POST(
      request({ service: "Testing", property, device_count, price_cents: 1 }),
    );
    expect(await res.json()).toEqual({
      available: true,
      repair_credit_cents: expected,
      policy_version: "testing-20260915-v1",
    });
    expect(res.headers.get("cache-control")).toBe("no-store");
  }
});
it("never guesses unknown counts or repair/installation scope", async () => {
  for (const device_count of [null, "", "More", "Not Sure", 0, 101, 1.5, "2"]) {
    expect(
      (
        await (
          await POST(
            request({
              service: "Testing",
              property: "Residential",
              device_count,
            }),
          )
        ).json()
      ).available,
    ).toBe(false);
  }
  for (const service of [
    "Repair / Replacement",
    "New Installation",
    "Not Sure",
  ]) {
    expect(
      (
        await (
          await POST(
            request({ service, property: "Residential", device_count: 2 }),
          )
        ).json()
      ).repair_credit_cents,
    ).toBeNull();
  }
});
