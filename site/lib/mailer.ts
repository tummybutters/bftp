import {
  type AgentMailAttachment,
  resolveAgentMailInboxId,
  sendAgentMailMessage,
} from "@/lib/agentmail";
import { parseServiceAccountKey, sendGmailMessage } from "@/lib/gmail";

/**
 * One place that decides how the contact form's mail leaves.
 *
 * Gmail is preferred when its key is present, so mail comes from a Backflow
 * Test Pros address customers recognise and can reply to. AgentMail remains
 * the transport when Gmail is not configured, which keeps previews and any
 * environment without the key working exactly as before.
 */

const DEFAULT_GMAIL_SENDER = "contact@backflowtestpros.com";

export type MailTransport =
  | { kind: "gmail"; key: NonNullable<ReturnType<typeof parseServiceAccountKey>>; sender: string }
  | { kind: "agentmail"; apiKey: string; inboxId?: string };

export interface ContactMail {
  fromName: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: AgentMailAttachment[];
}

export function resolveMailTransport(
  env: Record<string, string | undefined> = process.env,
): MailTransport | null {
  const key = parseServiceAccountKey(env.GOOGLE_SERVICE_ACCOUNT_KEY || "");

  if (key) {
    return {
      kind: "gmail",
      key,
      sender: env.CONTACT_GMAIL_SENDER?.trim() || DEFAULT_GMAIL_SENDER,
    };
  }

  const apiKey = env.AGENTMAIL_API_KEY?.trim() || "";

  return apiKey
    ? { kind: "agentmail", apiKey, inboxId: env.AGENTMAIL_INBOX_ID?.trim() }
    : null;
}

export async function sendContactMail(transport: MailTransport, mail: ContactMail) {
  if (transport.kind === "gmail") {
    return sendGmailMessage({ key: transport.key, sender: transport.sender, ...mail });
  }

  // Resolved once per request and remembered on the transport, so the
  // auto-reply does not look the inbox up a second time.
  transport.inboxId = await resolveAgentMailInboxId({
    apiKey: transport.apiKey,
    inboxId: transport.inboxId,
  });

  return sendAgentMailMessage({
    apiKey: transport.apiKey,
    inboxId: transport.inboxId,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    attachments: mail.attachments,
  });
}
