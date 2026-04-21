"use client";

import { usePostHog } from "posthog-js/react";
import type { ContactFormField } from "@/lib/content/types";

function renderField(
  field: ContactFormField,
  onFocus: (name: string, type: string) => void,
) {
  const fieldClasses =
    "w-full rounded-[1.2rem] border border-[color:rgba(31,45,78,0.14)] bg-white px-4 py-3 text-sm text-[color:var(--color-foreground)] shadow-[0_8px_24px_rgba(31,45,78,0.06)] outline-none transition focus:border-[color:var(--color-blue)]";

  if (field.fieldType === "textarea" || field.inputType === "textarea") {
    return (
      <textarea
        id={field.name}
        name={field.name}
        placeholder={field.placeholder}
        required={field.required}
        rows={6}
        className={`${fieldClasses} min-h-[10rem] resize-y`}
        onFocus={() => onFocus(field.name, "textarea")}
      />
    );
  }

  if (field.fieldType === "select") {
    return (
      <select
        id={field.name}
        name={field.name}
        required={field.required}
        defaultValue=""
        className={fieldClasses}
        onFocus={() => onFocus(field.name, "select")}
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
      className={fieldClasses}
      onFocus={() => onFocus(field.name, field.inputType || "text")}
    />
  );
}

export function TrackedContactForm({
  fields,
  submitLabel,
  formAction,
  formMethod,
}: {
  fields: ContactFormField[];
  submitLabel: string;
  formAction: string;
  formMethod: string;
}) {
  const posthog = usePostHog();

  const handleFocus = (fieldName: string, fieldType: string) => {
    posthog?.capture("form_field_focused", {
      field_name: fieldName,
      field_type: fieldType,
    });
  };

  const handleSubmit = () => {
    posthog?.capture("form_submitted", {
      form_action: formAction,
      field_count: fields.length,
    });
  };

  return (
    <form
      action={formAction || undefined}
      method={formMethod || "get"}
      className="grid gap-5 md:grid-cols-2"
      onSubmit={handleSubmit}
    >
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
          {renderField(field, handleFocus)}
        </label>
      ))}
      <div className="md:col-span-2">
        <button type="submit" className="bftp-cta-button">
          {submitLabel || "Send message"}
        </button>
      </div>
    </form>
  );
}
