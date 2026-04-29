"use client";

import Link from "next/link";
import { useState } from "react";
import { usePostHog } from "posthog-js/react";
import type { ContactFormField } from "@/lib/content/types";

import { siteConfig } from "@/lib/site-config";

interface QuizOption {
  value: string;
  label: string;
  description: string;
}

interface QuizStep {
  key: keyof QuizValues;
  title: string;
  description: string;
  options: QuizOption[];
}

interface QuizValues {
  serviceType: string;
  propertyType: string;
  county: string;
  urgency: string;
  deviceCount: string;
}

const SERVICE_OPTIONS: QuizOption[] = [
  {
    value: "Annual Testing",
    label: "Annual Testing",
    description: "Annual certification, due-date coverage, and water authority paperwork.",
  },
  {
    value: "Repair / Replacement",
    label: "Repair / Replacement",
    description: "Failed tests, leaking assemblies, broken devices, and urgent fixes.",
  },
  {
    value: "New Installation",
    label: "New Installation",
    description: "New assemblies, compliance installs, and approved device selection.",
  },
  {
    value: "Not Sure Yet",
    label: "Not Sure",
    description: "Start here if you need help figuring out the right next step.",
  },
];

const PROPERTY_OPTIONS: QuizOption[] = [
  {
    value: "Commercial / Business",
    label: "Commercial / Business",
    description: "Restaurants, retail, offices, stations, medical, and other business sites.",
  },
  {
    value: "Apartment / HOA / Multifamily",
    label: "Apartment / HOA / Multifamily",
    description: "HOAs, apartment communities, and shared-property water systems.",
  },
  {
    value: "Residential",
    label: "Residential",
    description: "Single-family homes and private residential irrigation or plumbing setups.",
  },
  {
    value: "Industrial / Facility",
    label: "Industrial / Facility",
    description: "Industrial, manufacturing, and specialized facility water connections.",
  },
];

const COUNTY_OPTIONS: QuizOption[] = [
  {
    value: "Los Angeles County",
    label: "Los Angeles County",
    description: "Coverage across LA County service areas and water authority requirements.",
  },
  {
    value: "Orange County",
    label: "Orange County",
    description: "Orange County commercial, multifamily, and residential coverage.",
  },
  {
    value: "San Diego County",
    label: "San Diego County",
    description: "San Diego County testing, installation, and repair coverage.",
  },
  {
    value: "Riverside County",
    label: "Riverside County",
    description: "Riverside County scheduling, compliance, and managed service support.",
  },
  {
    value: "San Bernardino County",
    label: "San Bernardino County",
    description: "San Bernardino County device testing, repair, and installation coverage.",
  },
  {
    value: "Ventura County",
    label: "Ventura County",
    description: "Ventura County service coordination and local compliance support.",
  },
];

const URGENCY_OPTIONS: QuizOption[] = [
  {
    value: "ASAP",
    label: "ASAP",
    description: "There is an immediate issue, deadline, or water-service concern.",
  },
  {
    value: "This Week",
    label: "This Week",
    description: "We should get this scheduled soon but it is not a same-day emergency.",
  },
  {
    value: "This Month",
    label: "This Month",
    description: "Planning ahead for an upcoming requirement, service window, or property need.",
  },
  {
    value: "Just Pricing / Planning",
    label: "Just Pricing / Planning",
    description: "Mostly gathering pricing, comparing options, or planning the next step.",
  },
];

const DEVICE_COUNT_OPTIONS: QuizOption[] = [
  {
    value: "1 Device",
    label: "1 Device",
    description: "One assembly or one property device needs attention.",
  },
  {
    value: "2-3 Devices",
    label: "2-3 Devices",
    description: "A small group of devices at one property or location.",
  },
  {
    value: "4-10 Devices",
    label: "4-10 Devices",
    description: "A multi-device property that may qualify for bundle or managed scheduling.",
  },
  {
    value: "10+ Devices",
    label: "10+ Devices",
    description: "A larger property, campus, portfolio, or multi-location need.",
  },
  {
    value: "Not Sure",
    label: "Not Sure",
    description: "You do not know the device count yet and need help figuring it out.",
  },
];

const QUIZ_STEPS: QuizStep[] = [
  {
    key: "serviceType",
    title: "What do you need help with?",
    description: "Choose the service path that best matches the property.",
    options: SERVICE_OPTIONS,
  },
  {
    key: "propertyType",
    title: "What type of property is this?",
    description: "This helps route the lead to the right scheduling and compliance flow.",
    options: PROPERTY_OPTIONS,
  },
  {
    key: "county",
    title: "Which county is the property in?",
    description: "Pick the county so we can anchor the lead to the right coverage area.",
    options: COUNTY_OPTIONS,
  },
  {
    key: "urgency",
    title: "How soon do you need help?",
    description: "This helps us prioritize urgent failures, notices, and due dates.",
    options: URGENCY_OPTIONS,
  },
  {
    key: "deviceCount",
    title: "About how many devices are involved?",
    description: "A quick estimate is enough. We can confirm exact counts later.",
    options: DEVICE_COUNT_OPTIONS,
  },
];

const FINAL_FIELD_ORDER = [
  "first-name-2",
  "last-name-2",
  "company_name",
  "phone",
  "email-field-2",
  "Message-Field-4",
] as const;

const FINAL_FIELD_FALLBACKS: ContactFormField[] = [
  {
    label: "First name",
    name: "first-name-2",
    fieldType: "input",
    inputType: "text",
    placeholder: "First name",
    required: true,
    options: [],
  },
  {
    label: "Last name",
    name: "last-name-2",
    fieldType: "input",
    inputType: "text",
    placeholder: "Last name",
    required: true,
    options: [],
  },
  {
    label: "Company / property name",
    name: "company_name",
    fieldType: "input",
    inputType: "text",
    placeholder: "Company, HOA, or property name",
    required: false,
    options: [],
  },
  {
    label: "Phone",
    name: "phone",
    fieldType: "input",
    inputType: "tel",
    placeholder: "(555) 555-5555",
    required: true,
    options: [],
  },
  {
    label: "Email",
    name: "email-field-2",
    fieldType: "input",
    inputType: "email",
    placeholder: "you@email-provider.com",
    required: true,
    options: [],
  },
  {
    label: "Anything else we should know?",
    name: "Message-Field-4",
    fieldType: "textarea",
    inputType: "textarea",
    placeholder: "Optional notes like notice letters, failed tests, access details, or special scheduling needs.",
    required: false,
    options: [],
  },
];

function renderField(
  field: ContactFormField,
  onFocus: (name: string, type: string) => void,
  value: string,
  onChange: (name: string, value: string) => void,
) {
  const fieldClasses = "bftp-intake-input";

  if (field.fieldType === "textarea" || field.inputType === "textarea") {
    return (
      <textarea
        id={field.name}
        name={field.name}
        placeholder={field.placeholder}
        required={field.required}
        rows={6}
        value={value}
        className={`${fieldClasses} min-h-[10rem] resize-y`}
        onFocus={() => onFocus(field.name, "textarea")}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    );
  }

  if (field.fieldType === "select") {
    return (
      <select
        id={field.name}
        name={field.name}
        required={field.required}
        value={value}
        className={fieldClasses}
        onFocus={() => onFocus(field.name, "select")}
        onChange={(event) => onChange(field.name, event.target.value)}
      >
        <option value="" disabled>
          {field.placeholder || field.label}
        </option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      id={field.name}
      name={field.name}
      type={field.inputType || "text"}
      placeholder={field.placeholder}
      required={field.required}
      value={value}
      className={fieldClasses}
      onFocus={() => onFocus(field.name, field.inputType || "text")}
      onChange={(event) => onChange(field.name, event.target.value)}
    />
  );
}

function getFieldDefaultValue(
  field: ContactFormField,
  leadTopic: string,
  prefilledMessage: string,
) {
  const fieldFingerprint = `${field.name} ${field.label} ${field.placeholder}`.toLowerCase();

  if (
    (field.fieldType === "textarea" || field.inputType === "textarea") &&
    prefilledMessage
  ) {
    return prefilledMessage;
  }

  if (field.fieldType === "select" && leadTopic) {
    const matchingOption = field.options.find(
      (option) => option.toLowerCase() === leadTopic.toLowerCase(),
    );

    return matchingOption || "";
  }

  if (fieldFingerprint.includes("subject") && leadTopic) {
    return leadTopic;
  }

  return "";
}

function normalizeLeadTopicToServiceValue(leadTopic: string) {
  const normalized = leadTopic.toLowerCase();

  if (!normalized) {
    return "";
  }

  if (normalized.includes("repair")) {
    return "Repair / Replacement";
  }

  if (normalized.includes("install")) {
    return "New Installation";
  }

  if (normalized.includes("test")) {
    return "Annual Testing";
  }

  if (normalized.includes("compliance")) {
    return "Not Sure Yet";
  }

  return "";
}

function getQuizFields(fields: ContactFormField[]) {
  const byName = new Map(fields.map((field) => [field.name, field]));

  return FINAL_FIELD_ORDER.map(
    (name) => byName.get(name) || FINAL_FIELD_FALLBACKS.find((field) => field.name === name),
  ).filter((field): field is ContactFormField => Boolean(field));
}

function getQuizValueLabel(stepKey: keyof QuizValues, value: string) {
  const step = QUIZ_STEPS.find((entry) => entry.key === stepKey);
  const option = step?.options.find((entry) => entry.value === value);

  return option?.label || value;
}

function renderLegacyForm({
  fields,
  submitLabel,
  normalizedAction,
  normalizedMethod,
  pagePath,
  sourceUrl,
  leadTopic,
  handlesInlineSubmit,
  status,
  statusMessage,
  fieldValues,
  prefilledMessage,
  handleSubmit,
  handleFocus,
  handleValueChange,
}: {
  fields: ContactFormField[];
  submitLabel: string;
  normalizedAction: string;
  normalizedMethod: string;
  pagePath?: string;
  sourceUrl: string;
  leadTopic: string;
  handlesInlineSubmit: boolean;
  status: "idle" | "submitting" | "success" | "error";
  statusMessage: string;
  fieldValues: Record<string, string>;
  prefilledMessage: string;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleFocus: (fieldName: string, fieldType: string) => void;
  handleValueChange: (fieldName: string, value: string) => void;
}) {
  return (
    <form
      action={normalizedAction || undefined}
      method={normalizedMethod || "get"}
      className="mx-auto grid w-full max-w-[1040px] gap-5 md:grid-cols-2"
      onSubmit={handleSubmit}
    >
      {pagePath ? <input type="hidden" name="page_path" value={pagePath} /> : null}
      {sourceUrl ? <input type="hidden" name="source_url" value={sourceUrl} /> : null}
      {leadTopic ? <input type="hidden" name="lead_topic" value={leadTopic} /> : null}
      <input type="hidden" name="lead_source" value="Website Contact Form" />
      <p className="text-center text-sm text-[color:var(--color-foreground)]/80 md:col-span-2">
        Prefer email?{" "}
        <Link
          href={siteConfig.email.href}
          className="font-semibold text-[color:var(--color-blue)] underline-offset-4 hover:underline"
        >
          {siteConfig.email.address}
        </Link>
      </p>
      {fields.map((field) => (
        <label
          key={field.name}
          htmlFor={field.name}
          className={
            field.fieldType === "textarea"
              ? "space-y-2 md:col-span-2"
              : "space-y-2"
          }
        >
          <span className="text-sm font-semibold text-[color:var(--color-foreground)]">
            {field.label}
          </span>
          {renderField(
            field,
            handleFocus,
            fieldValues[field.name] ??
              getFieldDefaultValue(field, leadTopic, prefilledMessage),
            handleValueChange,
          )}
        </label>
      ))}
      <div className="md:col-span-2">
        <div className="flex flex-col items-center gap-3">
          <button
            type="submit"
            className="bftp-cta-button w-full sm:w-auto"
            disabled={status === "submitting" || !handlesInlineSubmit}
            aria-disabled={status === "submitting" || !handlesInlineSubmit}
          >
            {status === "submitting" ? "Sending..." : submitLabel || "Send message"}
          </button>
          {status !== "idle" ? (
            <p
              role="status"
              className={
                status === "success"
                  ? "text-sm font-semibold text-[color:#18794e]"
                  : status === "error"
                    ? "text-sm font-semibold text-[color:#b42318]"
                    : "text-sm font-semibold text-[color:var(--color-foreground)]"
              }
            >
              {statusMessage}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}

export function TrackedContactForm({
  fields,
  submitLabel,
  formAction,
  formMethod,
  pagePath,
}: {
  fields: ContactFormField[];
  submitLabel: string;
  formAction: string;
  formMethod: string;
  pagePath?: string;
}) {
  const posthog = usePostHog();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const normalizedAction = formAction?.trim() || "/api/contact";
  const normalizedMethod = (formMethod?.trim() || (formAction ? "get" : "post")).toLowerCase();
  const handlesInlineSubmit = !formAction?.trim();
  const searchParams = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
  const sourceUrl = typeof window === "undefined" ? "" : window.location.href;
  const leadTopic =
    searchParams.get("topic")?.trim() || searchParams.get("service")?.trim() || "";
  const prefilledMessage =
    searchParams.get("details")?.trim() ||
    (leadTopic
      ? `I'm interested in ${leadTopic}. Please send me pricing and next steps.`
      : "");
  const [quizValues, setQuizValues] = useState<QuizValues>({
    serviceType: normalizeLeadTopicToServiceValue(leadTopic),
    propertyType: "",
    county: "",
    urgency: "",
    deviceCount: "",
  });
  const [currentStep, setCurrentStep] = useState(0);
  const useQuizIntake = pagePath === "/contact-backflowtestpros";
  const finalFields = getQuizFields(fields);
  const totalSteps = QUIZ_STEPS.length + 1;
  const isFinalStep = currentStep >= QUIZ_STEPS.length;
  const visibleStep = isFinalStep ? totalSteps : currentStep + 1;

  const handleFocus = (fieldName: string, fieldType: string) => {
    posthog?.capture("form_field_focused", {
      field_name: fieldName,
      field_type: fieldType,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    posthog?.capture("form_submitted", {
      form_action: normalizedAction,
      field_count: fields.length,
      intake_variant: useQuizIntake ? "quiz" : "legacy",
    });

    if (!handlesInlineSubmit) {
      return;
    }

    event.preventDefault();
    setStatus("submitting");
    setStatusMessage("Sending your message...");

    const form = event.currentTarget;

    try {
      const response = await fetch(normalizedAction, {
        method: "POST",
        body: new FormData(form),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to send your message.");
      }

      form.reset();
      setFieldValues({});
      setQuizValues({
        serviceType: normalizeLeadTopicToServiceValue(leadTopic),
        propertyType: "",
        county: "",
        urgency: "",
        deviceCount: "",
      });
      setCurrentStep(0);
      setStatus("success");
      setStatusMessage("Thanks. Your message has been sent.");
    } catch (error) {
      setStatus("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to send your message right now.",
      );
    }
  };

  const handleValueChange = (fieldName: string, value: string) => {
    setFieldValues((current) => ({
      ...current,
      [fieldName]: value,
    }));
  };

  const handleQuizChoice = (step: QuizStep, value: string) => {
    setQuizValues((current) => ({
      ...current,
      [step.key]: value,
    }));
    posthog?.capture("contact_quiz_option_selected", {
      step: step.key,
      value,
    });
    setCurrentStep((current) => Math.min(current + 1, QUIZ_STEPS.length));
    setStatus("idle");
    setStatusMessage("");
  };

  if (!useQuizIntake) {
    return renderLegacyForm({
      fields,
      submitLabel,
      normalizedAction,
      normalizedMethod,
      pagePath,
      sourceUrl,
      leadTopic,
      handlesInlineSubmit,
      status,
      statusMessage,
      fieldValues,
      prefilledMessage,
      handleSubmit,
      handleFocus,
      handleValueChange,
    });
  }

  const activeStep = QUIZ_STEPS[currentStep];
  const summaryEntries = QUIZ_STEPS.map((step) => ({
    key: step.key,
    title: step.title,
    value: quizValues[step.key],
  })).filter((entry) => entry.value);

  return (
    <form
      action={normalizedAction || undefined}
      method={normalizedMethod || "get"}
      className="mx-auto w-full max-w-[1180px]"
      onSubmit={handleSubmit}
    >
      {pagePath ? <input type="hidden" name="page_path" value={pagePath} /> : null}
      {sourceUrl ? <input type="hidden" name="source_url" value={sourceUrl} /> : null}
      <input type="hidden" name="lead_source" value="Website Quiz Intake" />
      <input type="hidden" name="lead_topic" value={quizValues.serviceType} />
      <input type="hidden" name="service_type" value={quizValues.serviceType} />
      <input type="hidden" name="property_type" value={quizValues.propertyType} />
      <input type="hidden" name="county" value={quizValues.county} />
      <input type="hidden" name="urgency" value={quizValues.urgency} />
      <input type="hidden" name="device_count" value={quizValues.deviceCount} />
      <div className="rounded-none border border-[color:rgba(31,45,78,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,249,252,0.96))] p-4 shadow-[0_18px_42px_rgba(15,23,42,0.06)] sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--color-blue)]/75">
                Guided Intake
              </p>
              <h3 className="text-[clamp(1.65rem,3.2vw,2.45rem)] font-semibold tracking-[-0.035em] text-[color:var(--color-foreground)]">
                {isFinalStep
                  ? "How should we reach you?"
                  : activeStep?.title}
              </h3>
              <p className="max-w-[50rem] text-sm leading-7 text-[color:var(--color-foreground)]/78 sm:text-base">
                {isFinalStep
                  ? "You’re almost done. Add your contact details and any extra notes, and we’ll take it from there."
                  : activeStep?.description}
              </p>
            </div>
            <div className="rounded-none border border-[color:rgba(31,45,78,0.14)] bg-[#f7f7fb] px-4 py-3 text-sm text-[color:var(--color-foreground)] shadow-none">
              <span className="font-semibold text-[color:var(--color-blue)]">
                Step {visibleStep}
              </span>{" "}
              of {totalSteps}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-6">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const completed = index < currentStep || (isFinalStep && index < totalSteps - 1);
              const active = index === currentStep || (isFinalStep && index === totalSteps - 1);

              return (
                <span
                  key={`progress-${index + 1}`}
                  className={`h-1.5 rounded-none transition ${
                    active
                      ? "bg-[color:var(--color-accent)]"
                      : completed
                        ? "bg-[color:rgba(31,45,78,0.5)]"
                        : "bg-[color:rgba(31,45,78,0.1)]"
                  }`}
                />
              );
            })}
          </div>

          {summaryEntries.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {summaryEntries.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  className="rounded-none border border-[color:rgba(31,45,78,0.14)] bg-[#f7f7fb] px-4 py-2 text-left text-sm text-[color:var(--color-foreground)] shadow-none transition hover:border-[color:rgba(31,45,78,0.24)] hover:bg-white"
                  onClick={() =>
                    setCurrentStep(
                      Math.max(
                        0,
                        QUIZ_STEPS.findIndex((step) => step.key === entry.key),
                      ),
                    )
                  }
                >
                  <span className="mr-2 font-semibold">{entry.title}:</span>
                  <span className="text-[color:var(--color-foreground)]/75">
                    {getQuizValueLabel(entry.key, entry.value)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {!isFinalStep && activeStep ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {activeStep.options.map((option) => {
                const selected = quizValues[activeStep.key] === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`group relative flex min-h-[8.75rem] flex-col justify-between overflow-hidden rounded-none border px-4 py-4 text-left transition ${
                      selected
                        ? "border-[color:rgba(255,183,0,0.58)] bg-[#fffdf7] shadow-[0_14px_28px_rgba(204,150,32,0.14)]"
                        : "border-[color:rgba(38,46,74,0.1)] bg-[#f7f7fb] shadow-none hover:-translate-y-0.5 hover:border-[color:rgba(255,183,0,0.28)] hover:bg-white hover:shadow-[0_16px_32px_rgba(31,39,67,0.08)]"
                    }`}
                    onClick={() => handleQuizChoice(activeStep, option.value)}
                  >
                    <span
                      className={`absolute inset-x-0 top-0 h-[3px] ${
                        selected
                          ? "bg-[color:var(--color-accent)]"
                          : "bg-[color:rgba(255,183,0,0.9)]"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-[clamp(1.05rem,1.2vw,1.25rem)] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--color-foreground)]">
                          {option.label}
                        </h4>
                        <span
                          className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-none border ${
                            selected
                              ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]"
                              : "border-[color:rgba(31,45,78,0.2)] bg-transparent"
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                      <p className="text-[0.9rem] leading-6 text-[color:var(--color-foreground)]/75">
                        {option.description}
                      </p>
                    </div>
                    <span className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-blue)]/64">
                      Tap to continue
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {finalFields.map((field) => (
                <label
                  key={field.name}
                  htmlFor={field.name}
                  className={
                    field.fieldType === "textarea"
                      ? "space-y-2 md:col-span-2"
                      : "space-y-2"
                  }
                >
                  <span className="text-sm font-semibold text-[color:var(--color-foreground)]">
                    {field.label}
                  </span>
                  {renderField(
                    field,
                    handleFocus,
                    fieldValues[field.name] ??
                      getFieldDefaultValue(field, leadTopic, prefilledMessage),
                    handleValueChange,
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-[color:rgba(31,45,78,0.08)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[color:var(--color-foreground)]/78">
              Prefer email?{" "}
              <Link
                href={siteConfig.email.href}
                className="font-semibold text-[color:var(--color-blue)] underline-offset-4 hover:underline"
              >
                {siteConfig.email.address}
              </Link>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {currentStep > 0 ? (
                <button
                  type="button"
                  className="rounded-none border border-[color:rgba(31,45,78,0.16)] bg-[#f7f7fb] px-5 py-3 text-sm font-semibold text-[color:var(--color-foreground)] transition hover:border-[color:rgba(31,45,78,0.28)] hover:bg-white"
                  onClick={() => setCurrentStep((current) => Math.max(0, current - 1))}
                >
                  Back
                </button>
              ) : null}
              {isFinalStep ? (
                <button
                  type="submit"
                  className="bftp-cta-button w-full sm:w-auto"
                  disabled={status === "submitting" || !handlesInlineSubmit}
                  aria-disabled={status === "submitting" || !handlesInlineSubmit}
                >
                  {status === "submitting" ? "Sending..." : submitLabel || "Send message"}
                </button>
              ) : null}
            </div>
          </div>

          {status !== "idle" ? (
            <p
              role="status"
              className={
                status === "success"
                  ? "text-sm font-semibold text-[color:#18794e]"
                  : status === "error"
                    ? "text-sm font-semibold text-[color:#b42318]"
                    : "text-sm font-semibold text-[color:var(--color-foreground)]"
              }
            >
              {statusMessage}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
