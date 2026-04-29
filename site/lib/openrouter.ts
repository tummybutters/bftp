const OPENROUTER_API_BASE_URL = "https://openrouter.ai/api/v1";
const MAX_AUTO_REPLY_WORDS = 140;

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: OpenRouterMessageContent;
    };
  }>;
}

type OpenRouterMessageContent =
  | string
  | Array<{
      type?: string;
      text?: string;
    }>;

interface PersonalizedAutoReplyParams {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  pagePath?: string;
  businessName: string;
  phoneDisplay: string;
  siteUrl: string;
  expectCallFrom: string;
  responseWindow: string;
}

const AUTO_REPLY_TEMPLATE_EXAMPLES = [
  [
    "Example 1",
    "Hi Jordan,",
    "",
    "Thanks for reaching out about annual backflow testing for your Irvine property. We've got your request and we'll take it from here.",
    "",
    "Next steps:",
    "1. We'll review the property details and the compliance timing you mentioned.",
    "2. Expect a call from our scheduling team within one business day to line up the next step.",
    `3. If the deadline is close, call (800) 803-6658 and we'll help move it forward.`,
    "",
    "Backflow Test Pros",
  ].join("\n"),
  [
    "Example 2",
    "Hi Alex,",
    "",
    "Thanks for contacting Backflow Test Pros about testing and compliance support for your commercial site. We have your note and we're reviewing it now.",
    "",
    "Next steps:",
    "1. We'll review the service request and any timing details that affect scheduling.",
    "2. Expect a call or email from our office within one business day.",
    "3. If anything is urgent, call (800) 803-6658 and we'll help move it up.",
    "",
    "Backflow Test Pros",
  ].join("\n"),
  [
    "Example 3",
    "Hi Maria,",
    "",
    "Thanks for reaching out about backflow repair support. We've got your message and we'll get the right next step moving.",
    "",
    "Next steps:",
    "1. We'll review the location, service type, and any deadline you mentioned.",
    "2. Expect a call from our scheduling team within one business day.",
    "3. If you'd rather talk sooner, call (800) 803-6658.",
    "",
    "Backflow Test Pros",
  ].join("\n"),
  [
    "Example 4",
    "Hi Thomas,",
    "",
    "Thanks for reaching out about urgent backflow testing for your Orange County location. We know tight compliance deadlines need a fast handoff, and we've flagged this for follow-up.",
    "",
    "Next steps:",
    "1. We'll review the request details and the timing around the deadline you mentioned.",
    "2. Expect a call or email from our scheduling team within one business day.",
    "3. If this needs attention sooner, call (800) 803-6658 and we'll help move it along.",
    "",
    "Backflow Test Pros",
  ].join("\n"),
].join("\n\n---\n\n");

function normalizeOpenRouterContent(content: OpenRouterMessageContent | undefined) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => item.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function cleanPersonalizedReply(value: string) {
  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/^subject:\s.*$/im, "")
    .replace(/^\[your name\].*$/gim, "")
    .replace(/^\[company name\].*$/gim, "")
    .trim();

  return normalized
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countWords(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean).length;
}

function endsWithCompleteSentence(value: string) {
  return /[.!?"]$/.test(value.trim());
}

function isUsablePersonalizedReply(value: string, businessName: string) {
  if (!value) {
    return false;
  }

  const normalized = value.trim();
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const numberedStepCount = (normalized.match(/^\d+\.\s+/gm) || []).length;
  const lower = normalized.toLowerCase();

  if (countWords(normalized) > MAX_AUTO_REPLY_WORDS) {
    return false;
  }

  if (!lower.includes("next steps:")) {
    return false;
  }

  if (numberedStepCount < 2) {
    return false;
  }

  if (!lines.at(-1)?.includes(businessName)) {
    return false;
  }

  if (!endsWithCompleteSentence(lines.at(-2) || lines.at(-1) || "")) {
    return false;
  }

  if (
    lower.includes("i can see") ||
    lower.includes("i want you to know") ||
    lower.includes("we have received your inquiry")
  ) {
    return false;
  }

  return true;
}

function buildPromptMessages({
  firstName,
  lastName,
  email,
  message,
  pagePath,
  businessName,
  phoneDisplay,
  expectCallFrom,
  responseWindow,
}: PersonalizedAutoReplyParams): OpenRouterMessage[] {
  return [
    {
      role: "system",
      content: [
        `You write short, warm, specific customer acknowledgement emails for ${businessName}.`,
        "Return only the plain-text email body.",
        "Do not include a subject line.",
        "Do not use markdown.",
        "Do not include placeholders.",
        `Keep it under ${MAX_AUTO_REPLY_WORDS} words.`,
        "Do not sound like generic AI customer support.",
        'Avoid phrases like "I can see", "I want you to know", "we have received your inquiry", or anything stiff and corporate.',
        "Write like a real operations coordinator handing off the request, not a polished chatbot.",
        "Acknowledge the customer's actual request in a personalized way.",
        "If the customer mentions a service, county, city, or compliance issue, mirror that naturally.",
        'Always include a short "Next steps:" section with 2 or 3 numbered steps.',
        `One of the steps must say to expect a call or email from ${expectCallFrom}.`,
        `The timing should be described as ${responseWindow}.`,
        `If helpful, mention they can call ${phoneDisplay} for urgent help.`,
        "Do not promise pricing, schedules, or completed actions.",
        "Do not invent details that were not provided.",
        "Use the tone and structure of the examples closely, but personalize the wording to the incoming message.",
        "The copy should feel direct, grounded, and local.",
        `End the email with "${businessName}".`,
      ].join(" "),
    },
    {
      role: "user",
      content: [
        `Customer first name: ${firstName}`,
        `Customer last name: ${lastName}`,
        `Customer email: ${email}`,
        `Page path: ${pagePath || "Unknown"}`,
        `Expected caller/sender: ${expectCallFrom}`,
        `Expected response timing: ${responseWindow}`,
        "Customer message:",
        message,
        "",
        "Write the reply in the style of one of these examples:",
        AUTO_REPLY_TEMPLATE_EXAMPLES,
      ].join("\n"),
    },
  ];
}

async function parseOpenRouterError(response: Response) {
  const fallbackMessage = `OpenRouter request failed with status ${response.status}.`;

  try {
    const payload = (await response.json()) as
      | { error?: { message?: string }; message?: string }
      | null;

    return payload?.error?.message || payload?.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function generatePersonalizedAutoReply(
  params: PersonalizedAutoReplyParams,
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "minimax/minimax-m2.7";

  if (!apiKey) {
    return null;
  }

  const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || params.siteUrl,
      "X-OpenRouter-Title": process.env.OPENROUTER_APP_TITLE || params.businessName,
    },
    body: JSON.stringify({
      model,
      temperature: 0.55,
      max_tokens: 900,
      reasoning: {
        exclude: true,
      },
      messages: buildPromptMessages(params),
    }),
  });

  if (!response.ok) {
    throw new Error(await parseOpenRouterError(response));
  }

  const payload = (await response.json()) as OpenRouterChatCompletionResponse;
  const content = normalizeOpenRouterContent(payload.choices?.[0]?.message?.content);
  const cleaned = cleanPersonalizedReply(content);

  if (!isUsablePersonalizedReply(cleaned, params.businessName)) {
    return null;
  }

  return cleaned;
}
