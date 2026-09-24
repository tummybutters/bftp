import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  contactIntentFromSearch,
  INTAKE_VARIANT,
  serviceOptions,
} from "@/lib/contact-intake";
import {
  normalizeSubmission,
  validateSubmission,
} from "@/lib/contact-submission";
import { acceptedSubmissionId, readContactResponse } from "@/lib/contact-response";
import { UPLOAD_BUDGET_BYTES } from "@/lib/contact-uploads";

const queued = vi.hoisted(() => ({ tasks: [] as Array<() => Promise<void>> }));
const analyticsCapture = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/analytics/posthog-server", () => ({ captureServerEvent: analyticsCapture }));
vi.mock("next/server", () => ({
  after: (task: () => Promise<void>) => queued.tasks.push(task),
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));
function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({
    intake_variant: INTAKE_VARIANT,
    first_name: "QA",
    last_name: "Example",
    email: "qa@example.invalid",
    phone: "2025550108",
    address_street: "100 Test Avenue",
    address_city: "Los Angeles",
    address_state: "CA",
    address_postal_code: "90012",
    property_type: "Residential",
    service_type: "Testing",
    urgency: "This Week",
    ...overrides,
  }).forEach(([k, v]) => data.set(k, v));
  return data;
}
const request = (data: FormData) =>
  new Request("http://localhost/api/contact", { method: "POST", body: data });
describe("Intake contracts", () => {
  for (const [service] of serviceOptions)
    it(`${service}: accepts a complete address without technical knowledge`, () => {
      const data = form({ service_type: service });
      expect(
        validateSubmission(normalizeSubmission(data, request(data))),
      ).toBeNull();
    });
  it("rejects an incomplete address even if a client supplies formatted text", () => {
    const data = form({ address_city: "", service_address: "claimed address" });
    expect(
      validateSubmission(normalizeSubmission(data, request(data))),
    ).toContain("street address");
  });
  it("keeps address, unit and preferred date through the email summary", () => {
    const data = form({
      address_unit: "Suite 2",
      preferred_date: "2026-10-01",
      service_address: "spoofed summary",
    });
    const result = normalizeSubmission(data, request(data));
    expect(result.message).toContain("100 Test Avenue, Los Angeles, CA 90012");
    expect(result.message).toContain("Suite 2");
    expect(result.message).toContain("Preferred Date (not booked): 2026-10-01");
    expect(result.message).not.toContain("spoofed summary");
  });
  it("preserves the existing form's required county and repair detail rules", () => {
    let data = form({
      intake_variant: "",
      service_type: "Repair / Replacement",
    });
    expect(validateSubmission(normalizeSubmission(data, request(data)))).toBe(
      "Please complete all required fields.",
    );
    data = form({
      intake_variant: "",
      county: "Los Angeles County",
      service_type: "Repair / Replacement",
    });
    expect(
      validateSubmission(normalizeSubmission(data, request(data))),
    ).toContain("size/make/model");
  });
  it("rejects invalid email, phone and service values", () => {
    for (const change of [
      { email: "bad" },
      { phone: "123" },
      { service_type: "unknown" },
    ] as Record<string, string>[]) {
      const data = form(change);
      expect(
        validateSubmission(normalizeSubmission(data, request(data))),
      ).toBeTruthy();
    }
  });
  it("preserves the platform-safe upload limit", () => {
    const data = form();
    data.append(
      "contact_uploads",
      new File([new Uint8Array(UPLOAD_BUDGET_BYTES + 1)], "large.pdf", {
        type: "application/pdf",
      }),
    );
    expect(
      validateSubmission(normalizeSubmission(data, request(data))),
    ).toContain("uploads");
  });
  it("turns gateway and oversized failures into useful customer copy", async () => {
    expect(
      (
        await readContactResponse(
          new Response("Request Entity Too Large", { status: 413 }),
        )
      )?.reason,
    ).toBe("payload_too_large");
    expect(
      (
        await readContactResponse(
          new Response("<html>Bad Gateway</html>", { status: 502 }),
        )
      )?.reason,
    ).toBe("gateway");
  });
});

describe("Actual contact handler with captured provider requests", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    queued.tasks = [];
    vi.stubEnv("AGENTMAIL_API_KEY", "fixture-only");
    vi.stubEnv("AGENTMAIL_INBOX_ID", "fixture-inbox");
    vi.stubEnv("HOUSECALLPRO_API_KEY", "fixture-only");
    vi.stubEnv("CONTACT_AUTOREPLY_ENABLED", "true");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("POSTHOG_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
  });
  it("sends the full address to the notification, reply, CRM customer notes and lead; queues no call", async () => {
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL, options?: RequestInit) => {
        const body = JSON.parse(String(options?.body || "{}"));
        calls.push({ url: String(url), body });
        return Response.json(
          String(url).includes("agentmail")
            ? { message_id: "fixture-message", thread_id: "fixture-thread" }
            : {
                id: String(url).includes("customers")
                  ? "fixture-customer"
                  : "fixture-lead",
              },
        );
      }),
    );
    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(
      request(
        form({
          service_type: "Repair / Replacement",
          address_unit: "Suite 2",
          preferred_date: "2026-10-01",
          contact_preference: "email",
          testing_count: "12",
          address_source: "mapbox",
        }),
      ),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).housecallStatus).toBe("queued");
    expect(calls[0].body.text).toContain(
      "100 Test Avenue, Los Angeles, CA 90012",
    );
    for (const task of queued.tasks) await task();
    const patch = calls.find((c) =>
      c.url.endsWith("/customers/fixture-customer"),
    );
    expect(patch?.body.notes).toContain(
      "100 Test Avenue, Los Angeles, CA 90012",
    );
    expect(patch?.body.notes).toContain("Suite 2");
    expect(patch?.body.notes).toContain("Preferred Contact: email");
    expect(patch?.body.notes).toContain("12");
    expect(calls[0].body.text).toContain("Preferred Contact: email");
    expect(patch?.body.notes).toContain("not booked");
    expect(calls.some((c) => c.url.endsWith("/leads"))).toBe(true);
    const mail = calls.filter((c) => c.url.includes("agentmail"));
    expect(mail).toHaveLength(2);
    expect(mail[1].body.text).toContain("Expect an email from our team");
    expect(mail[1].body.text).not.toContain("Expect a call");
    expect(
      calls.every((c) => /api\.(agentmail\.to|housecallpro\.com)/.test(c.url)),
    ).toBe(true);
  });
  it("blocks every provider write in a Vercel preview even when live credentials are inherited", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { POST } = await import("@/app/api/contact/route");
    expect((await POST(request(form()))).status).toBe(409);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("never reports success when both downstream providers fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: "Fixture unavailable" }, { status: 503 }),
      ),
    );
    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(request(form()));
    expect(response.status).toBe(500);
    expect((await response.json()).error).toContain("call");
  });
});
it("does not mistake an HTML 200 or empty response for an accepted submission", async () => {
  expect(
    await readContactResponse(
      new Response("<html>Login</html>", { status: 200 }),
    ),
  ).not.toBeNull();
  expect(await readContactResponse(Response.json({ ok: true }))).toBeNull();
});

it("only joins analytics to a server-generated opaque submission ID", () => {
  const id = "82615aaa-f269-47e4-8dc0-af367a94a18f";
  expect(acceptedSubmissionId({ submissionId: id })).toBe(id);
  expect(acceptedSubmissionId({ submissionId: "someone@example.com" })).toBeUndefined();
  expect(acceptedSubmissionId({ submissionId: "" })).toBeUndefined();
});

it("preserves offer and service intent from existing homepage pricing links", () => {
  const intent = contactIntentFromSearch(
    "?topic=Residential+Testing+Value+Package&details=Please+send+pricing",
  );
  expect(intent).toMatchObject({ service: "Testing", property: "Residential" });
  const data = form({ "Message-Field-4": intent.notes });
  expect(normalizeSubmission(data, request(data)).message).toContain(
    "Selected offer: Residential Testing Value Package",
  );
  expect(contactIntentFromSearch("?service=installation").service).toBe(
    "New Installation",
  );
});

it("preserves exact or unknown device counts without guessing, and accepts a single name", () => {
  for (const count of ["", "Not Sure", "1", "5", "6", "12", "100"]) {
    const data = form({
      testing_count: count,
      last_name: "",
      address_source: "mapbox",
      contact_preference: "email",
    });
    const normalized = normalizeSubmission(data, request(data));
    expect(validateSubmission(normalized)).toBeNull();
    expect(normalized.testingCount).toBe(count);
    expect(normalized.addressSource).toBe("mapbox");
  }
  for (const count of ["0", "101", "1.5", "More", "-1"]) {
    const data = form({ testing_count: count });
    expect(
      validateSubmission(normalizeSubmission(data, request(data))),
    ).toContain("device count");
  }
});

it("keeps an accepted fallback lead but reports undelivered attachments honestly", async () => {
  queued.tasks = [];
  analyticsCapture.mockClear();
  vi.stubEnv("VERCEL_ENV", "development");
  vi.stubEnv("AGENTMAIL_API_KEY", "");
  vi.stubEnv("HOUSECALLPRO_API_KEY", "fixture");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ id: "fixture" })),
  );
  const data = form();
  data.append(
    "contact_uploads",
    new File(["fixture"], "notice.pdf", { type: "application/pdf" }),
  );
  const { POST } = await import("@/app/api/contact/route");
  const receipt = await (await POST(request(data))).json();
  expect(receipt).toMatchObject({
    ok: true,
    attachmentStatus: "not_delivered",
  });
  for (const task of queued.tasks) await task();
  expect(analyticsCapture).toHaveBeenCalledWith(expect.objectContaining({
    event: "lead_housecall_delivery_completed",
    properties: expect.objectContaining({
      submission_id: receipt.submissionId,
      housecall_status: "sent",
    }),
  }));
});
