import { siteConfig } from "@/lib/site-config";

export interface HousecallLeadSubmission {
  submissionId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  propertyType: string;
  county: string;
  urgency: string;
  deviceCount: string;
  notes: string;
  message: string;
  pagePath: string;
  sourceUrl: string;
  leadTopic: string;
  leadSource: string;
  city: string;
  referrer: string;
  userAgent: string;
}

export interface HousecallLeadResult {
  status: "skipped" | "sent" | "failed";
  customerId?: string;
  leadId?: string;
  detail?: string;
}

class HousecallApiError extends Error {
  status: number;
  responseBody: unknown;

  constructor(message: string, status: number, responseBody: unknown) {
    super(message);
    this.name = "HousecallApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

const HOUSECALL_BASE_URL =
  process.env.HOUSECALLPRO_API_BASE_URL?.trim() || "https://api.housecallpro.com";
const HOUSECALL_CUSTOMERS_PATH =
  process.env.HOUSECALLPRO_CUSTOMERS_PATH?.trim() || "/customers";
const HOUSECALL_LEADS_PATH =
  process.env.HOUSECALLPRO_LEADS_PATH?.trim() || "/leads";

function normalizePhoneDigits(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}

function formatHousecallDetail(detail: unknown) {
  if (!detail) {
    return "";
  }

  if (typeof detail === "string") {
    return detail;
  }

  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

function joinUrl(baseUrl: string, path: string) {
  return new URL(path.replace(/^\/*/, "/"), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

function appendPathSegment(path: string, segment: string) {
  return `${path.replace(/\/+$/, "")}/${segment.replace(/^\/+/, "")}`;
}

function parseJsonSafely(value: string) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractHousecallId(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const candidate = payload as Record<string, unknown>;
  const directId = candidate.id;

  if (typeof directId === "string" && directId.trim()) {
    return directId.trim();
  }

  for (const key of ["customer", "lead", "data", "result"]) {
    const nested = candidate[key];

    if (nested && typeof nested === "object" && "id" in (nested as Record<string, unknown>)) {
      const nestedId = (nested as Record<string, unknown>).id;

      if (typeof nestedId === "string" && nestedId.trim()) {
        return nestedId.trim();
      }
    }
  }

  return "";
}

function normalizePhone(phone: string) {
  const digits = normalizePhoneDigits(phone);

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.startsWith("+")) {
    return phone.trim();
  }

  return phone.trim();
}

function buildHousecallNote(submission: HousecallLeadSubmission) {
  const lines = [
    "Website intake summary",
    `Submission ID: ${submission.submissionId}`,
    `Service Type: ${submission.leadTopic || "Not provided"}`,
    `Property Type: ${submission.propertyType || "Not provided"}`,
    `County: ${submission.county || "Not provided"}`,
    `Urgency: ${submission.urgency || "Not provided"}`,
    `Device Count: ${submission.deviceCount || "Not provided"}`,
  ];

  if (submission.companyName) {
    lines.push(`Company / Property Name: ${submission.companyName}`);
  }

  if (submission.city) {
    lines.push(`City: ${submission.city}`);
  }

  if (submission.notes) {
    lines.push(`Additional Details: ${submission.notes}`);
  }

  if (submission.pagePath) {
    lines.push(`Page Path: ${submission.pagePath}`);
  }

  if (submission.sourceUrl) {
    lines.push(`Source URL: ${submission.sourceUrl}`);
  }

  if (submission.referrer) {
    lines.push(`Referrer: ${submission.referrer}`);
  }

  if (submission.userAgent) {
    lines.push(`User Agent: ${submission.userAgent}`);
  }

  return lines.join("\n");
}

function cleanTagValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildHousecallTags(submission: HousecallLeadSubmission) {
  const candidates = [
    "Website Intake",
    submission.leadTopic ? `Service: ${submission.leadTopic}` : "",
    submission.propertyType ? `Property: ${submission.propertyType}` : "",
    submission.county ? `County: ${submission.county}` : "",
    submission.city ? `City: ${submission.city}` : "",
    submission.urgency ? `Urgency: ${submission.urgency}` : "",
    submission.deviceCount ? `Devices: ${submission.deviceCount}` : "",
  ];

  const unique = new Set<string>();

  for (const candidate of candidates) {
    const cleaned = cleanTagValue(candidate);

    if (cleaned) {
      unique.add(cleaned);
    }
  }

  return Array.from(unique);
}

async function sendHousecallRequest<T>({
  apiKey,
  method,
  path,
  body,
}: {
  apiKey: string;
  method: "POST" | "PATCH";
  path: string;
  body: Record<string, unknown>;
}): Promise<T> {
  const url = joinUrl(HOUSECALL_BASE_URL, path);
  const authVariants: Record<string, string>[] = [
    { Authorization: `Token ${apiKey}` },
    { Authorization: `Bearer ${apiKey}` },
    { "X-API-Key": apiKey },
  ];

  let lastError: HousecallApiError | null = null;

  for (const authHeaders of authVariants) {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders,
    };
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });
    const responseText = await response.text();
    const responsePayload = parseJsonSafely(responseText) ?? responseText;

    if (response.ok) {
      return responsePayload as T;
    }

    const detail = formatHousecallDetail(responsePayload);
    lastError = new HousecallApiError(
      `Housecall request failed for ${path} with ${response.status}${detail ? `: ${detail}` : ""}`,
      response.status,
      responsePayload,
    );

    if (response.status !== 401 && response.status !== 403) {
      throw lastError;
    }
  }

  throw (
    lastError ||
    new HousecallApiError("Housecall request failed before a response was received.", 500, null)
  );
}

async function createHousecallCustomer(apiKey: string, submission: HousecallLeadSubmission) {
  const normalizedPhone = normalizePhone(submission.phone);
  const variants = [
    {
      first_name: submission.firstName,
      last_name: submission.lastName,
      email: submission.email,
      mobile_number: normalizedPhone,
    },
    {
      first_name: submission.firstName,
      last_name: submission.lastName,
      email: submission.email,
      phone_number: normalizedPhone,
    },
    {
      first_name: submission.firstName,
      last_name: submission.lastName,
      email: submission.email,
      phone: normalizedPhone,
    },
  ];

  let lastError: HousecallApiError | null = null;

  for (const payload of variants) {
    try {
      const response = await sendHousecallRequest<Record<string, unknown>>({
        apiKey,
        method: "POST",
        path: HOUSECALL_CUSTOMERS_PATH,
        body: payload,
      });
      const customerId = extractHousecallId(response);

      if (!customerId) {
        throw new HousecallApiError(
          "Housecall customer creation succeeded but no customer ID was returned.",
          500,
          response,
        );
      }

      return customerId;
    } catch (error) {
      if (
        error instanceof HousecallApiError &&
        [400, 404, 422].includes(error.status)
      ) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw (
    lastError ||
    new HousecallApiError("Housecall customer creation could not be completed.", 500, null)
  );
}

async function updateHousecallCustomer(
  apiKey: string,
  customerId: string,
  submission: HousecallLeadSubmission,
) {
  const payload = {
    first_name: submission.firstName,
    last_name: submission.lastName,
    email: submission.email,
    mobile_number: normalizePhoneDigits(submission.phone),
    company: submission.companyName || undefined,
    notes: buildHousecallNote(submission),
    tags: buildHousecallTags(submission),
  };

  return sendHousecallRequest<Record<string, unknown>>({
    apiKey,
    method: "PATCH",
    path: appendPathSegment(HOUSECALL_CUSTOMERS_PATH, customerId),
    body: payload,
  });
}

async function createHousecallLead(
  apiKey: string,
  customerId: string,
  submission: HousecallLeadSubmission,
) {
  const tags = buildHousecallTags(submission);
  const variants = [
    submission.leadSource
      ? { customer_id: customerId, lead_source: submission.leadSource, tags }
      : null,
    { customer_id: customerId, tags },
    submission.leadSource ? { customer_id: customerId, lead_source: submission.leadSource } : null,
    { customer_id: customerId },
  ].filter(Boolean) as Array<Record<string, unknown>>;

  let lastError: HousecallApiError | null = null;

  for (const payload of variants) {
    try {
      const response = await sendHousecallRequest<Record<string, unknown>>({
        apiKey,
        method: "POST",
        path: HOUSECALL_LEADS_PATH,
        body: payload,
      });

      return extractHousecallId(response);
    } catch (error) {
      if (error instanceof HousecallApiError && [400, 404, 422].includes(error.status)) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw (
    lastError ||
    new HousecallApiError("Housecall lead creation could not be completed.", 500, null)
  );
}

export async function sendHousecallLead(
  submission: HousecallLeadSubmission,
): Promise<HousecallLeadResult> {
  const apiKey = process.env.HOUSECALLPRO_API_KEY?.trim();

  if (!apiKey) {
    return {
      status: "skipped",
      detail: "HOUSECALLPRO_API_KEY is not configured.",
    };
  }

  try {
    const customerId = await createHousecallCustomer(apiKey, submission);
    await updateHousecallCustomer(apiKey, customerId, submission);
    const leadId = await createHousecallLead(apiKey, customerId, submission);

    console.info("Housecall lead sent.", {
      submissionId: submission.submissionId,
      customerId,
      leadId,
      pagePath: submission.pagePath,
      leadTopic: submission.leadTopic,
      leadSource: submission.leadSource,
      companyName: submission.companyName,
      propertyType: submission.propertyType,
      county: submission.county,
      urgency: submission.urgency,
      deviceCount: submission.deviceCount,
      city: submission.city,
      site: siteConfig.url,
    });

    return {
      status: "sent",
      customerId,
      leadId,
    };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown Housecall delivery error.";

    console.error("Housecall lead delivery failed.", {
      submissionId: submission.submissionId,
      detail,
      error,
    });

    return {
      status: "failed",
      detail,
    };
  }
}
