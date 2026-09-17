import { createSign } from "node:crypto";

import type { AgentMailAttachment } from "@/lib/agentmail";

/**
 * Sends the contact form's mail from a real Backflow Test Pros mailbox.
 *
 * The Workspace service account is authorised for domain-wide delegation, so a
 * signed JWT naming a mailbox as `sub` is exchanged for a one-hour token that
 * acts as that mailbox. `gmail.modify` is requested because it is the Gmail
 * scope the delegation grants; asking for a scope outside the grant fails the
 * exchange outright rather than narrowing it.
 */

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.modify";
const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL =
  "https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface GmailSendParams {
  key: ServiceAccountKey;
  sender: string;
  fromName: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: AgentMailAttachment[];
}

let cachedToken: { mailbox: string; token: string; expiresAt: number } | null =
  null;

/** The key may be pasted as JSON or as base64 of that JSON; Vercel mangles neither. */
export function parseServiceAccountKey(raw: string): ServiceAccountKey | null {
  const value = raw.trim();
  if (!value) return null;

  try {
    const json = value.startsWith("{")
      ? value
      : Buffer.from(value, "base64").toString("utf8");
    const key = JSON.parse(json) as Partial<ServiceAccountKey>;

    if (!key.client_email || !key.private_key) return null;

    return {
      client_email: key.client_email,
      // A key stored through a shell often arrives with literal "\n".
      private_key: key.private_key.replaceAll("\\n", "\n"),
      token_uri: key.token_uri,
    };
  } catch {
    return null;
  }
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function mintToken(key: ServiceAccountKey, mailbox: string) {
  const now = Math.floor(Date.now() / 1000);

  if (
    cachedToken &&
    cachedToken.mailbox === mailbox &&
    cachedToken.expiresAt - 120 > now
  ) {
    return cachedToken.token;
  }

  const audience = key.token_uri || DEFAULT_TOKEN_URI;
  const unsigned = `${base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64Url(
    JSON.stringify({
      iss: key.client_email,
      sub: mailbox,
      scope: GMAIL_SCOPE,
      aud: audience,
      iat: now,
      exp: now + 3600,
    }),
  )}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(key.private_key)
    .toString("base64url");

  const response = await fetch(audience, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });

  if (!response.ok) {
    // Google's error names the cause (unauthorized_client, invalid_grant) and
    // never echoes the key, so it is safe to surface.
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`Google token exchange failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };
  cachedToken = {
    mailbox,
    token: payload.access_token,
    expiresAt: now + (payload.expires_in ?? 3600),
  };

  return payload.access_token;
}

/** A submitted name or subject must never be able to add a header of its own. */
function headerSafe(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function encodeHeaderText(value: string) {
  const safe = headerSafe(value);
  return /^[\x20-\x7e]*$/.test(safe)
    ? safe
    : `=?UTF-8?B?${Buffer.from(safe, "utf8").toString("base64")}?=`;
}

function wrapBase64(value: string) {
  return value.replace(/(.{76})/g, "$1\r\n");
}

function textPart(contentType: string, body: string) {
  return [
    `Content-Type: ${contentType}; charset="UTF-8"`,
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(Buffer.from(body, "utf8").toString("base64")),
  ].join("\r\n");
}

export function buildMimeMessage({
  sender,
  fromName,
  to,
  subject,
  text,
  html,
  attachments = [],
}: Omit<GmailSendParams, "key">) {
  const recipients = (Array.isArray(to) ? to : [to]).map(headerSafe);
  const boundary = `bftp-${crypto.randomUUID()}`;
  const altBoundary = `${boundary}-alt`;

  const body = html
    ? [
        `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
        "",
        `--${altBoundary}`,
        textPart("text/plain", text),
        `--${altBoundary}`,
        textPart("text/html", html),
        `--${altBoundary}--`,
      ].join("\r\n")
    : textPart("text/plain", text);

  const headers = [
    `From: "${headerSafe(fromName).replaceAll('"', "'")}" <${headerSafe(sender)}>`,
    `To: ${recipients.join(", ")}`,
    `Subject: ${encodeHeaderText(subject)}`,
    "MIME-Version: 1.0",
  ];

  if (!attachments.length) {
    return `${headers.join("\r\n")}\r\n${body}\r\n`;
  }

  const files = attachments.map((attachment) => {
    const filename = headerSafe(attachment.filename || "upload").replaceAll('"', "'");
    return [
      `--${boundary}`,
      `Content-Type: ${headerSafe(attachment.content_type || "application/octet-stream")}; name="${filename}"`,
      `Content-Disposition: attachment; filename="${filename}"`,
      "Content-Transfer-Encoding: base64",
      "",
      wrapBase64(attachment.content),
    ].join("\r\n");
  });

  return [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    body,
    ...files,
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

export async function sendGmailMessage(params: GmailSendParams) {
  const token = await mintToken(params.key, params.sender);
  const response = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "message/rfc822",
    },
    body: buildMimeMessage(params),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`Gmail send failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as { id: string; threadId: string };

  return { message_id: payload.id, thread_id: payload.threadId };
}

/** For tests: a cached token must not leak between cases. */
export function resetGmailTokenCache() {
  cachedToken = null;
}
