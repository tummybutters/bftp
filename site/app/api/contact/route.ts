import { NextResponse } from "next/server";

import {
  resolveAgentMailInboxId,
  sendAgentMailMessage,
} from "@/lib/agentmail";
import { sendHousecallLead } from "@/lib/housecall";
import { generatePersonalizedAutoReply } from "@/lib/openrouter";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";

interface ContactSubmission {
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

function readField(formData: FormData, names: string[]) {
  for (const name of names) {
    const value = formData.get(name);

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function buildStructuredMessage(submission: ContactSubmission) {
  const lines = [
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
    lines.push("", "Additional Details:", submission.notes);
  }

  return lines.join("\n");
}

function normalizeSubmission(formData: FormData, request: Request): ContactSubmission {
  const headers = request.headers;
  const submission: ContactSubmission = {
    submissionId: crypto.randomUUID(),
    firstName: readField(formData, ["first-name-2", "first_name", "firstName"]),
    lastName: readField(formData, ["last-name-2", "last_name", "lastName"]),
    email: readField(formData, ["email-field-2", "email", "emailAddress"]),
    phone: readField(formData, ["phone", "phone_number", "phoneNumber"]),
    companyName: readField(formData, ["company_name", "companyName", "company"]),
    propertyType: readField(formData, ["property_type", "propertyType"]),
    county: readField(formData, ["county", "service_county", "serviceCounty"]),
    urgency: readField(formData, ["urgency", "timeline"]),
    deviceCount: readField(formData, ["device_count", "deviceCount"]),
    notes: readField(formData, ["Message-Field-4", "message", "details"]),
    message: "",
    pagePath: readField(formData, ["page_path", "pagePath", "source_path"]),
    sourceUrl: readField(formData, ["source_url", "sourceUrl"]),
    leadTopic: readField(formData, [
      "service_type",
      "lead_topic",
      "topic",
      "service",
      "subject",
    ]),
    leadSource:
      readField(formData, ["lead_source", "leadSource"]) || "Website Contact Form",
    city: readField(formData, ["city", "service_city", "serviceCity"]),
    referrer: headers.get("referer") || "",
    userAgent: headers.get("user-agent") || "",
  };

  submission.message = buildStructuredMessage(submission);

  return submission;
}

function validateSubmission(submission: ContactSubmission) {
  if (
    !submission.firstName ||
    !submission.lastName ||
    !submission.email ||
    !submission.phone ||
    !submission.leadTopic ||
    !submission.propertyType ||
    !submission.county ||
    !submission.urgency ||
    !submission.deviceCount
  ) {
    return "Please complete all required fields.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    return "Please enter a valid email address.";
  }

  if (submission.phone.replace(/\D/g, "").length < 10) {
    return "Please enter a valid phone number.";
  }

  return null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildNotificationText(submission: ContactSubmission) {
  const fullName = `${submission.firstName} ${submission.lastName}`.trim();

  return [
    "New Backflow Test Pros contact form submission",
    "",
    `Submission ID: ${submission.submissionId}`,
    `Name: ${fullName}`,
    ...(submission.companyName
      ? [`Company / Property Name: ${submission.companyName}`]
      : []),
    `Email: ${submission.email}`,
    `Phone: ${submission.phone}`,
    ...(submission.leadTopic ? [`Topic: ${submission.leadTopic}`] : []),
    ...(submission.propertyType
      ? [`Property Type: ${submission.propertyType}`]
      : []),
    ...(submission.county ? [`County: ${submission.county}`] : []),
    ...(submission.deviceCount
      ? [`Device Count: ${submission.deviceCount}`]
      : []),
    ...(submission.urgency ? [`Urgency: ${submission.urgency}`] : []),
    ...(submission.city ? [`City: ${submission.city}`] : []),
    `Lead Source: ${submission.leadSource || "Unknown"}`,
    `Page: ${submission.pagePath || "Unknown"}`,
    ...(submission.sourceUrl ? [`Source URL: ${submission.sourceUrl}`] : []),
    ...(submission.referrer ? [`Referrer: ${submission.referrer}`] : []),
    ...(submission.userAgent ? [`User Agent: ${submission.userAgent}`] : []),
    "",
    "Message:",
    submission.message,
  ].join("\n");
}

function buildNotificationHtml(submission: ContactSubmission) {
  const fullName = escapeHtml(`${submission.firstName} ${submission.lastName}`.trim());
  const email = escapeHtml(submission.email);
  const pagePath = escapeHtml(submission.pagePath || "Unknown");
  const message = escapeHtml(submission.message).replaceAll("\n", "<br />");

  return [
    "<div style=\"font-family:Arial,sans-serif;color:#1f2d4e;line-height:1.6;\">",
    "<h2 style=\"margin:0 0 16px;\">New Backflow Test Pros contact form submission</h2>",
    `<p style="margin:0 0 8px;"><strong>Submission ID:</strong> ${escapeHtml(submission.submissionId)}</p>`,
    `<p style="margin:0 0 8px;"><strong>Name:</strong> ${fullName}</p>`,
    ...(submission.companyName
      ? [
          `<p style="margin:0 0 8px;"><strong>Company / Property Name:</strong> ${escapeHtml(
            submission.companyName,
          )}</p>`,
        ]
      : []),
    `<p style="margin:0 0 8px;"><strong>Email:</strong> ${email}</p>`,
    `<p style="margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(submission.phone)}</p>`,
    ...(submission.leadTopic
      ? [
          `<p style="margin:0 0 8px;"><strong>Topic:</strong> ${escapeHtml(
            submission.leadTopic,
          )}</p>`,
        ]
      : []),
    ...(submission.propertyType
      ? [
          `<p style="margin:0 0 8px;"><strong>Property Type:</strong> ${escapeHtml(
            submission.propertyType,
          )}</p>`,
        ]
      : []),
    ...(submission.county
      ? [
          `<p style="margin:0 0 8px;"><strong>County:</strong> ${escapeHtml(
            submission.county,
          )}</p>`,
        ]
      : []),
    ...(submission.deviceCount
      ? [
          `<p style="margin:0 0 8px;"><strong>Device Count:</strong> ${escapeHtml(
            submission.deviceCount,
          )}</p>`,
        ]
      : []),
    ...(submission.urgency
      ? [
          `<p style="margin:0 0 8px;"><strong>Urgency:</strong> ${escapeHtml(
            submission.urgency,
          )}</p>`,
        ]
      : []),
    ...(submission.city
      ? [
          `<p style="margin:0 0 8px;"><strong>City:</strong> ${escapeHtml(
            submission.city,
          )}</p>`,
        ]
      : []),
    `<p style="margin:0 0 8px;"><strong>Lead Source:</strong> ${escapeHtml(
      submission.leadSource || "Unknown",
    )}</p>`,
    `<p style="margin:0 0 16px;"><strong>Page:</strong> ${pagePath}</p>`,
    ...(submission.sourceUrl
      ? [
          `<p style="margin:0 0 8px;"><strong>Source URL:</strong> ${escapeHtml(
            submission.sourceUrl,
          )}</p>`,
        ]
      : []),
    ...(submission.referrer
      ? [
          `<p style="margin:0 0 8px;"><strong>Referrer:</strong> ${escapeHtml(
            submission.referrer,
          )}</p>`,
        ]
      : []),
    ...(submission.userAgent
      ? [
          `<p style="margin:0 0 16px;"><strong>User Agent:</strong> ${escapeHtml(
            submission.userAgent,
          )}</p>`,
        ]
      : []),
    `<p style="margin:0;"><strong>Message:</strong></p><p style="margin:8px 0 0;">${message}</p>`,
    "</div>",
  ].join("");
}

function buildAutoReplyText(submission: ContactSubmission) {
  const expectCallFrom =
    process.env.CONTACT_AUTOREPLY_EXPECT_CALL_FROM || "our scheduling team";
  const responseWindow =
    process.env.CONTACT_AUTOREPLY_RESPONSE_WINDOW || "within one business day";
  const message = submission.message.trim();
  const lower = `${submission.pagePath} ${submission.leadTopic} ${submission.urgency} ${message}`.toLowerCase();
  const locationLabel = submission.county || submission.city;
  const isUrgent =
    /\b(urgent|asap|deadline|today|tomorrow|this week|rush|immediately)\b/i.test(
      lower,
    ) || submission.urgency.toLowerCase() === "asap";

  let serviceLabel = submission.leadTopic || "your backflow service request";

  if (!submission.leadTopic && lower.includes("repair")) {
    serviceLabel = "backflow repair support";
  } else if (!submission.leadTopic && lower.includes("install")) {
    serviceLabel = "backflow installation support";
  } else if (!submission.leadTopic && lower.includes("test")) {
    serviceLabel = "backflow testing";
  } else if (!submission.leadTopic && lower.includes("compliance")) {
    serviceLabel = "backflow compliance support";
  }

  const openingTopic = [
    isUrgent ? "urgent" : "",
    serviceLabel,
    locationLabel ? `for ${locationLabel}` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const intro = openingTopic
    ? `Thanks for reaching out about ${openingTopic}. We've got your message and we're reviewing it now.`
    : "Thanks for reaching out to Backflow Test Pros. We've got your message and we're reviewing it now.";

  const reviewStep = isUrgent
    ? "1. We'll review the service details and the timing around the deadline you mentioned."
    : "1. We'll review the service details and confirm the best next step for your property.";
  const finalStep = isUrgent
    ? `3. If the timing is tight, call ${siteConfig.phone.display} and we'll help move it along.`
    : `3. If you'd rather talk sooner, call ${siteConfig.phone.display}.`;

  return [
    `Hi ${submission.firstName},`,
    "",
    intro,
    "",
    "Next steps:",
    reviewStep,
    `2. Expect a call or email from ${expectCallFrom} ${responseWindow}.`,
    finalStep,
    "",
    siteConfig.name,
  ].join("\n");
}

function buildEmailHtmlFromText(text: string) {
  const html = escapeHtml(text).replaceAll("\n", "<br />");

  return [
    "<div style=\"font-family:Arial,sans-serif;color:#1f2d4e;line-height:1.6;\">",
    `<p style="margin:0;">${html}</p>`,
    "</div>",
  ].join("");
}

async function buildPersonalizedAutoReplyText(submission: ContactSubmission) {
  const expectCallFrom =
    process.env.CONTACT_AUTOREPLY_EXPECT_CALL_FROM || "our scheduling team";
  const responseWindow =
    process.env.CONTACT_AUTOREPLY_RESPONSE_WINDOW || "within one business day";

  try {
    const personalizedReply = await generatePersonalizedAutoReply({
      firstName: submission.firstName,
      lastName: submission.lastName,
      email: submission.email,
      message: submission.message,
      pagePath: submission.pagePath,
      businessName: siteConfig.name,
      phoneDisplay: siteConfig.phone.display,
      siteUrl: siteConfig.url,
      expectCallFrom,
      responseWindow,
    });

    if (personalizedReply) {
      return personalizedReply;
    }
  } catch (error) {
    console.error("OpenRouter auto-reply generation failed. Falling back to default copy.", error);
  }

  return buildAutoReplyText(submission);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const submission = normalizeSubmission(formData, request);
  const validationError = validateSubmission(submission);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const agentMailApiKey = process.env.AGENTMAIL_API_KEY?.trim() || "";
  const hasAgentMail = Boolean(agentMailApiKey);

  if (!hasAgentMail && !process.env.HOUSECALLPRO_API_KEY?.trim()) {
    console.error("Contact form has no downstream delivery configured.");

    return NextResponse.json(
      { error: "The contact form is not configured yet." },
      { status: 500 },
    );
  }

  let notificationThreadId = "";
  let autoReplyStatus: "sent" | "skipped" | "failed" = "skipped";
  let notificationStatus: "sent" | "skipped" | "failed" = "skipped";
  let notificationErrorDetail = "";

  if (hasAgentMail) {
    try {
      const inboxId = await resolveAgentMailInboxId({
        apiKey: agentMailApiKey,
        inboxId: process.env.AGENTMAIL_INBOX_ID,
      });
      const fullName = `${submission.firstName} ${submission.lastName}`.trim();
      const notificationRecipient = process.env.CONTACT_NOTIFICATION_TO || inboxId;
      const fromName = process.env.AGENTMAIL_FROM_NAME || "Backflow Test Pros";

      const notification = await sendAgentMailMessage({
        apiKey: agentMailApiKey,
        inboxId,
        to: notificationRecipient,
        subject: submission.leadTopic
          ? `New contact form lead: ${fullName} - ${submission.leadTopic}`
          : `New contact form lead: ${fullName}`,
        text: buildNotificationText(submission),
        html: buildNotificationHtml(submission),
      });
      notificationThreadId = notification.thread_id;
      notificationStatus = "sent";

      if (process.env.CONTACT_AUTOREPLY_ENABLED === "true") {
        try {
          const autoReplyText = await buildPersonalizedAutoReplyText(submission);

          // Keep customer auto-replies immediate for now. We can revisit a delayed
          // send path later once we have a reliable background scheduler.
          await sendAgentMailMessage({
            apiKey: agentMailApiKey,
            inboxId,
            to: submission.email,
            subject: `${fromName} received your message`,
            text: autoReplyText,
            html: buildEmailHtmlFromText(autoReplyText),
          });
          autoReplyStatus = "sent";
        } catch (error) {
          autoReplyStatus = "failed";
          console.error("AgentMail auto-reply failed.", {
            submissionId: submission.submissionId,
            error,
          });
        }
      }
    } catch (error) {
      notificationStatus = "failed";
      notificationErrorDetail =
        error instanceof Error ? error.message : "Unknown AgentMail error.";
      console.error("Contact form email delivery failed.", {
        submissionId: submission.submissionId,
        error,
      });
    }
  }

  const housecallResult = await sendHousecallLead(submission);

  if (notificationStatus !== "sent" && housecallResult.status !== "sent") {
    console.error("Contact form delivery failed for all downstream destinations.", {
      submissionId: submission.submissionId,
      notificationStatus,
      notificationErrorDetail,
      housecallResult,
    });

    return NextResponse.json(
      {
        error:
          "We couldn't send your message right now. Please call (800) 803-6658.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    submissionId: submission.submissionId,
    notificationStatus,
    notificationThreadId: notificationThreadId || undefined,
    autoReplyStatus,
    housecallStatus: housecallResult.status,
    housecallCustomerId: housecallResult.customerId,
    housecallLeadId: housecallResult.leadId,
  });
}
