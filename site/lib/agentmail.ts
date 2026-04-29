const AGENTMAIL_API_BASE_URL = "https://api.agentmail.to/v0";

interface AgentMailInboxRecord {
  inbox_id: string;
}

interface AgentMailInboxesResponse {
  inboxes?: AgentMailInboxRecord[];
}

interface AgentMailSendMessageParams {
  apiKey: string;
  inboxId: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

interface AgentMailCreateDraftParams {
  apiKey: string;
  inboxId: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  sendAt?: string;
  clientId?: string;
}

function buildAgentMailHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function parseAgentMailError(response: Response) {
  const fallbackMessage = `AgentMail request failed with status ${response.status}.`;

  try {
    const payload = (await response.json()) as
      | { message?: string; errors?: Array<{ message?: string }> }
      | null;

    return (
      payload?.message ||
      payload?.errors?.map((error) => error.message).filter(Boolean).join(", ") ||
      fallbackMessage
    );
  } catch {
    return fallbackMessage;
  }
}

export async function resolveAgentMailInboxId({
  apiKey,
  inboxId,
}: {
  apiKey: string;
  inboxId?: string | null;
}) {
  if (inboxId) {
    return inboxId;
  }

  const response = await fetch(`${AGENTMAIL_API_BASE_URL}/inboxes?limit=1`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseAgentMailError(response));
  }

  const payload = (await response.json()) as AgentMailInboxesResponse;
  const discoveredInboxId = payload.inboxes?.[0]?.inbox_id;

  if (!discoveredInboxId) {
    throw new Error("AgentMail inbox lookup returned no inboxes.");
  }

  return discoveredInboxId;
}

export async function sendAgentMailMessage({
  apiKey,
  inboxId,
  to,
  subject,
  text,
  html,
}: AgentMailSendMessageParams) {
  const recipients = Array.isArray(to) ? to : [to];
  const response = await fetch(
    `${AGENTMAIL_API_BASE_URL}/inboxes/${encodeURIComponent(inboxId)}/messages/send`,
    {
      method: "POST",
      headers: buildAgentMailHeaders(apiKey),
      body: JSON.stringify({
        to: recipients,
        subject,
        text,
        ...(html ? { html } : {}),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await parseAgentMailError(response));
  }

  return (await response.json()) as {
    message_id: string;
    thread_id: string;
  };
}

export async function createAgentMailDraft({
  apiKey,
  inboxId,
  to,
  subject,
  text,
  html,
  sendAt,
  clientId,
}: AgentMailCreateDraftParams) {
  const recipients = Array.isArray(to) ? to : [to];
  const response = await fetch(
    `${AGENTMAIL_API_BASE_URL}/inboxes/${encodeURIComponent(inboxId)}/drafts`,
    {
      method: "POST",
      headers: buildAgentMailHeaders(apiKey),
      body: JSON.stringify({
        to: recipients,
        subject,
        text,
        ...(html ? { html } : {}),
        ...(sendAt ? { send_at: sendAt } : {}),
        ...(clientId ? { client_id: clientId } : {}),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await parseAgentMailError(response));
  }

  return (await response.json()) as {
    draft_id: string;
    thread_id: string;
    send_status?: "scheduled" | "sending" | "failed" | null;
    send_at?: string | null;
  };
}
