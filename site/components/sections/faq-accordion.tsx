"use client";

import { usePostHog } from "posthog-js/react";
import type { FaqItem } from "@/lib/content/types";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const posthog = usePostHog();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[color:rgba(31,45,78,0.12)] bg-white shadow-[0_18px_48px_rgba(31,45,78,0.08)]">
      {items.map((item, index) => (
        <details
          key={`${item.question}-${index}`}
          className="group border-b border-[color:rgba(31,45,78,0.1)] last:border-b-0"
          onToggle={(e) => {
            if ((e.target as HTMLDetailsElement).open) {
              posthog?.capture("faq_expanded", {
                question: item.question,
                index,
              });
            }
          }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-left text-base font-bold text-[color:var(--color-foreground)]">
            <span>{item.question}</span>
            <span className="text-[color:var(--color-blue)] transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="px-6 pb-6 pt-0 text-sm leading-7 text-[color:var(--color-muted)]">
            {item.answer
              .replaceAll("\u200d", "\n")
              .split(/\n+/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph) => (
                <p key={paragraph} className="mt-3 first:mt-0">
                  {paragraph}
                </p>
              ))}
          </div>
        </details>
      ))}
    </div>
  );
}
