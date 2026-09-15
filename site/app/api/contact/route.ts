import { after, NextResponse } from "next/server";

import {
  type AgentMailAttachment,
  resolveAgentMailInboxId,
  sendAgentMailMessage,
} from "@/lib/agentmail";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import {
  normalizeSubmission,
  validateSubmission,
  type ContactSubmission,
} from "@/lib/contact-submission";
import { sendHousecallLead } from "@/lib/housecall";
import { generatePersonalizedAutoReply } from "@/lib/openrouter";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";

// Analytics flushes after the response; provider latency cannot delay a customer's receipt.
function queueAnalytics(input: Parameters<typeof captureServerEvent>[0]) {
  after(() => captureServerEvent(input));
}

const DEFAULT_NOTIFICATION_EMAIL = "contact@backflowtestpros.com";
const SUBMISSION_TIME_ZONE = "America/Los_Angeles";

function splitRecipientList(value: string) {
  return value
    .split(/[,;\s]+/)
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

function buildNotificationRecipients(configuredRecipient: string) {
  const recipients = splitRecipientList(configuredRecipient);

  return Array.from(
    new Set(recipients.length > 0 ? recipients : [DEFAULT_NOTIFICATION_EMAIL]),
  );
}

function formatSubmittedAt(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: SUBMISSION_TIME_ZONE,
      timeZoneName: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function readHeader(request: Request, name: string) {
  return request.headers.get(name)?.trim() || "";
}

function getAnalyticsDistinctId(
  request: Request,
  submission: ContactSubmission,
) {
  return (
    readHeader(request, "x-posthog-distinct-id") ||
    `lead:${submission.submissionId}`
  );
}

function getEmailDomain(email: string) {
  return email.split("@")[1]?.trim().toLowerCase() || "";
}

function getLeadAnalyticsProperties(
  submission: ContactSubmission,
  request: Request,
  extra: Record<string, string | number | boolean | null | undefined> = {},
) {
  const sessionId = readHeader(request, "x-posthog-session-id");

  return {
    submission_id: submission.submissionId,
    intake_variant: submission.intakeVariant || "legacy",
    address_present: Boolean(submission.addressStreet),
    posthog_session_id: sessionId || undefined,
    lead_topic: submission.leadTopic || undefined,
    service_type: submission.leadTopic || undefined,
    property_type: submission.propertyType || undefined,
    county: submission.county || undefined,
    urgency: submission.urgency || undefined,
    city: submission.city || undefined,
    page_path: submission.pagePath || undefined,
    lead_source: submission.leadSource || undefined,
    submitted_at: submission.submittedAt,
    email_domain: getEmailDomain(submission.email) || undefined,
    has_company_name: Boolean(submission.companyName),
    has_uploads: submission.uploadFiles.length > 0,
    upload_count: submission.uploadFiles.length,
    source_url_present: Boolean(submission.sourceUrl),
    referrer_present: Boolean(submission.referrer),
    ...extra,
  };
}

async function buildAgentMailAttachments(
  formData: FormData,
): Promise<AgentMailAttachment[]> {
  const files = formData
    .getAll("contact_uploads")
    .filter((value): value is File => value instanceof File && value.size > 0);

  return Promise.all(
    files.map(async (file) => ({
      filename: file.name || "upload",
      content_type: file.type || "application/octet-stream",
      content_disposition: "attachment" as const,
      content: Buffer.from(await file.arrayBuffer()).toString("base64"),
    })),
  );
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
    `Submitted At: ${formatSubmittedAt(submission.submittedAt)}`,
    `Name: ${fullName}`,
    ...(submission.companyName
      ? [`Company Name: ${submission.companyName}`]
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
    ...(submission.testingCount
      ? [`# of Backflow Tests Needed: ${submission.testingCount}`]
      : []),
    ...(submission.sizeMakeModel
      ? [`Size, Make, Model: ${submission.sizeMakeModel}`]
      : []),
    ...(submission.serviceDetails
      ? [`Brief Description: ${submission.serviceDetails}`]
      : []),
    ...(submission.uploadFiles.length > 0
      ? [
          `Uploaded Files: ${submission.uploadFiles
            .map((file) => `${file.name} (${Math.round(file.size / 1024)} KB)`)
            .join(", ")}`,
        ]
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
  const fullName = escapeHtml(
    `${submission.firstName} ${submission.lastName}`.trim(),
  );
  const email = escapeHtml(submission.email);
  const pagePath = escapeHtml(submission.pagePath || "Unknown");
  const message = escapeHtml(submission.message).replaceAll("\n", "<br />");

  return [
    '<div style="font-family:Arial,sans-serif;color:#1f2d4e;line-height:1.6;">',
    '<h2 style="margin:0 0 16px;">New Backflow Test Pros contact form submission</h2>',
    `<p style="margin:0 0 8px;"><strong>Submission ID:</strong> ${escapeHtml(submission.submissionId)}</p>`,
    `<p style="margin:0 0 8px;"><strong>Submitted At:</strong> ${escapeHtml(
      formatSubmittedAt(submission.submittedAt),
    )}</p>`,
    `<p style="margin:0 0 8px;"><strong>Name:</strong> ${fullName}</p>`,
    ...(submission.companyName
      ? [
          `<p style="margin:0 0 8px;"><strong>Company Name:</strong> ${escapeHtml(
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
    ...(submission.testingCount
      ? [
          `<p style="margin:0 0 8px;"><strong># of Backflow Tests Needed:</strong> ${escapeHtml(
            submission.testingCount,
          )}</p>`,
        ]
      : []),
    ...(submission.sizeMakeModel
      ? [
          `<p style="margin:0 0 8px;"><strong>Size, Make, Model:</strong> ${escapeHtml(
            submission.sizeMakeModel,
          )}</p>`,
        ]
      : []),
    ...(submission.serviceDetails
      ? [
          `<p style="margin:0 0 8px;"><strong>Brief Description:</strong> ${escapeHtml(
            submission.serviceDetails,
          )}</p>`,
        ]
      : []),
    ...(submission.uploadFiles.length > 0
      ? [
          `<p style="margin:0 0 8px;"><strong>Uploaded Files:</strong> ${escapeHtml(
            submission.uploadFiles
              .map(
                (file) => `${file.name} (${Math.round(file.size / 1024)} KB)`,
              )
              .join(", "),
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
  const lower =
    `${submission.pagePath} ${submission.leadTopic} ${submission.urgency} ${message}`.toLowerCase();
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
    '<div style="font-family:Arial,sans-serif;color:#1f2d4e;line-height:1.6;">',
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
    console.error(
      "OpenRouter auto-reply generation failed. Falling back to default copy.",
      error,
    );
  }

  return buildAutoReplyText(submission);
}

export async function POST(request: Request) {
  // Preview deployments inherit provider variables. Never let a design review create real leads.
  if (process.env.VERCEL_ENV === "preview") {
    return NextResponse.json(
      { error: "This is a preview. Your request has not been sent." },
      { status: 409 },
    );
  }
  const formData = await request.formData();
  const submission = normalizeSubmission(formData, request);
  const validationError = validateSubmission(submission);
  const distinctId = getAnalyticsDistinctId(request, submission);
  const analyticsProperties = (
    extra: Record<string, string | number | boolean | null | undefined> = {},
  ) => getLeadAnalyticsProperties(submission, request, extra);

  if (validationError) {
    queueAnalytics({
      distinctId,
      event: "contact_form_validation_failed",
      properties: analyticsProperties({
        validation_error: validationError,
      }),
    });

    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  queueAnalytics({
    distinctId,
    event: "lead_received",
    properties: analyticsProperties({
      intake_source: "contact_api",
    }),
  });

  const notificationAttachments = await buildAgentMailAttachments(formData);
  const agentMailApiKey = process.env.AGENTMAIL_API_KEY?.trim() || "";
  const hasAgentMail = Boolean(agentMailApiKey);

  if (!hasAgentMail && !process.env.HOUSECALLPRO_API_KEY?.trim()) {
    console.error("Contact form has no downstream delivery configured.");
    queueAnalytics({
      distinctId,
      event: "lead_delivery_failed",
      properties: analyticsProperties({
        failure_reason: "no_downstream_delivery_configured",
        notification_status: "skipped",
        housecall_status: "skipped",
      }),
    });

    return NextResponse.json(
      { error: "The contact form is not configured yet." },
      { status: 500 },
    );
  }

  let notificationThreadId = "";
  let autoReplyStatus: "sent" | "skipped" | "failed" | "queued" = "skipped";
  let notificationStatus: "sent" | "skipped" | "failed" = "skipped";
  let notificationErrorDetail = "";
  let inboxId = "";
  const fromName = process.env.AGENTMAIL_FROM_NAME || "Backflow Test Pros";

  if (hasAgentMail) {
    try {
      inboxId = await resolveAgentMailInboxId({
        apiKey: agentMailApiKey,
        inboxId: process.env.AGENTMAIL_INBOX_ID,
      });
      const fullName = `${submission.firstName} ${submission.lastName}`.trim();
      const notificationRecipients = buildNotificationRecipients(
        process.env.CONTACT_NOTIFICATION_TO || "",
      );

      const notification = await sendAgentMailMessage({
        apiKey: agentMailApiKey,
        inboxId,
        to: notificationRecipients,
        subject: submission.leadTopic
          ? `New contact form lead: ${fullName} - ${submission.leadTopic}`
          : `New contact form lead: ${fullName}`,
        text: buildNotificationText(submission),
        html: buildNotificationHtml(submission),
        attachments: notificationAttachments,
      });
      notificationThreadId = notification.thread_id;
      notificationStatus = "sent";
    } catch (error) {
      notificationStatus = "failed";
      notificationErrorDetail =
        error instanceof Error ? error.message : "Unknown AgentMail error.";
      console.error("Contact form email delivery failed.", {
        submissionId: submission.submissionId,
        error,
      });
      queueAnalytics({
        distinctId,
        event: "lead_notification_failed",
        properties: analyticsProperties({
          notification_status: notificationStatus,
          failure_reason: "agentmail_delivery_failed",
        }),
      });
    }
  }

  if (notificationStatus === "sent") {
    const hasHousecall = Boolean(process.env.HOUSECALLPRO_API_KEY?.trim());

    autoReplyStatus =
      process.env.CONTACT_AUTOREPLY_ENABLED === "true" ? "queued" : "skipped";

    after(async () => {
      if (process.env.CONTACT_AUTOREPLY_ENABLED === "true") {
        try {
          const autoReplyText =
            await buildPersonalizedAutoReplyText(submission);

          // Keep customer auto-replies immediate, but let Next run the work after
          // the response so the browser is not blocked on OpenRouter/AgentMail.
          await sendAgentMailMessage({
            apiKey: agentMailApiKey,
            inboxId,
            to: submission.email,
            subject: `${fromName} received your message`,
            text: autoReplyText,
            html: buildEmailHtmlFromText(autoReplyText),
          });
        } catch (error) {
          console.error("AgentMail auto-reply failed.", {
            submissionId: submission.submissionId,
            error,
          });
          queueAnalytics({
            distinctId,
            event: "lead_auto_reply_failed",
            properties: analyticsProperties({
              notification_status: notificationStatus,
              auto_reply_status: "failed",
            }),
          });
        }
      }

      if (hasHousecall) {
        const queuedHousecallResult = await sendHousecallLead(submission);

        queueAnalytics({
          distinctId,
          event: "lead_housecall_delivery_completed",
          properties: analyticsProperties({
            notification_status: notificationStatus,
            housecall_status: queuedHousecallResult.status,
            has_housecall_customer_id: Boolean(
              queuedHousecallResult.customerId,
            ),
            has_housecall_lead_id: Boolean(queuedHousecallResult.leadId),
          }),
        });
      }
    });

    queueAnalytics({
      distinctId,
      event: "lead_delivered",
      properties: analyticsProperties({
        delivery_path: "agentmail",
        notification_status: notificationStatus,
        auto_reply_status: autoReplyStatus,
        housecall_status: hasHousecall ? "queued" : "skipped",
      }),
    });

    return NextResponse.json({
      ok: true,
      submissionId: submission.submissionId,
      notificationStatus,
      attachmentStatus: notificationAttachments.length ? "delivered" : "none",
      notificationThreadId: notificationThreadId || undefined,
      autoReplyStatus,
      housecallStatus: hasHousecall ? "queued" : "skipped",
    });
  }

  const housecallResult = await sendHousecallLead(submission);

  if (housecallResult.status !== "sent") {
    console.error(
      "Contact form delivery failed for all downstream destinations.",
      {
        submissionId: submission.submissionId,
        notificationStatus,
        notificationErrorDetail,
        housecallResult,
      },
    );
    queueAnalytics({
      distinctId,
      event: "lead_delivery_failed",
      properties: analyticsProperties({
        failure_reason: "all_downstream_delivery_failed",
        notification_status: notificationStatus,
        housecall_status: housecallResult.status,
      }),
    });

    return NextResponse.json(
      {
        error:
          "We couldn't send your message right now. Please call (800) 803-6658.",
      },
      { status: 500 },
    );
  }

  queueAnalytics({
    distinctId,
    event: "lead_delivered",
    properties: analyticsProperties({
      delivery_path: "housecall",
      notification_status: notificationStatus,
      auto_reply_status: autoReplyStatus,
      housecall_status: housecallResult.status,
      has_housecall_customer_id: Boolean(housecallResult.customerId),
      has_housecall_lead_id: Boolean(housecallResult.leadId),
    }),
  });

  return NextResponse.json({
    ok: true,
    submissionId: submission.submissionId,
    notificationStatus,
    attachmentStatus: notificationAttachments.length ? "not_delivered" : "none",
    notificationThreadId: notificationThreadId || undefined,
    autoReplyStatus,
    housecallStatus: housecallResult.status,
    housecallCustomerId: housecallResult.customerId,
    housecallLeadId: housecallResult.leadId,
  });
}
