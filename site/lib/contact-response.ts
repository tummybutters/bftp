import { siteConfig } from "@/lib/site-config";

/**
 * Reading a reply the endpoint did not necessarily write.
 *
 * The form used to call `response.json()` unconditionally. Every failure that
 * originates above the route -- a 413 from the platform's body limit, a 502
 * from a cold start, a 504 from a slow upstream -- answers in plain text or
 * HTML, so the parse threw before the status was ever looked at and the
 * customer was shown the parser's own complaint:
 *
 *   Unexpected token 'R', "Request En"... is not valid JSON
 *
 * That is verbatim what someone saw on 2026-08-13 before giving up. It told
 * them nothing about what to do, and it told us nothing either -- one
 * indistinguishable string standing in for every gateway failure there is.
 *
 * So: read the body as text, parse it only when it is JSON, and turn anything
 * else into what the person should do next. The `reason` beside the message is
 * a closed vocabulary rather than prose, because the message is for the
 * customer and the reason is what we will search PostHog for the next time this
 * happens.
 */

export type ContactFailureReason =
  | "payload_too_large"
  | "rejected"
  | "server_error"
  | "gateway"
  | "network";

export interface ContactFailure {
  reason: ContactFailureReason;
  message: string;
}

const CALL_US = `We couldn't send your message right now. Please call ${siteConfig.phone.display}.`;

function parseJsonObject(body: string): { error?: string } | null {
  const trimmed = body.trim();

  if (!trimmed.startsWith("{")) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    return parsed && typeof parsed === "object" ? (parsed as { error?: string }) : null;
  } catch {
    return null;
  }
}

/** Null when the submission went through. */
export async function readContactResponse(response: Response): Promise<ContactFailure | null> {
  if (response.ok) {
    return null;
  }

  const body = await response.text().catch(() => "");
  const payload = parseJsonObject(body);

  // The platform, not the route. Nothing we send back from `/api/contact` is
  // ever a 413, because a body large enough to earn one never arrives.
  if (response.status === 413) {
    return {
      reason: "payload_too_large",
      message: `Your attachments were too large to send. Remove the largest one and try again, or email them to ${siteConfig.email.address}.`,
    };
  }

  // The route's own validation copy is already written for a customer
  // ("Please enter a 10-digit phone number."), so it is passed through as-is.
  if (payload?.error) {
    return {
      reason: response.status >= 500 ? "server_error" : "rejected",
      message: payload.error,
    };
  }

  if (response.status === 502 || response.status === 503 || response.status === 504) {
    return { reason: "gateway", message: CALL_US };
  }

  return {
    reason: response.status >= 500 ? "server_error" : "rejected",
    message: CALL_US,
  };
}

/**
 * `fetch` rejecting rather than answering -- the connection dropped, the tab
 * went offline mid-upload, a proxy cut it. Chrome renders this as "Failed to
 * fetch", which is what the 2026-06-08 customer was shown on mobile.
 */
export function describeNetworkFailure(): ContactFailure {
  return {
    reason: "network",
    message: `Your connection dropped before the message went through. Check your signal and try again, or call ${siteConfig.phone.display}.`,
  };
}
