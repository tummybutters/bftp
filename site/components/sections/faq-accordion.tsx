"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";
import type { FaqItem } from "@/lib/content/types";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openItems, setOpenItems] = useState<Set<number>>(() => new Set());
  const posthog = usePostHog();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bftp-faq-accordion">
      {items.map((item, index) => {
        const isOpen = openItems.has(index);
        const paragraphs = item.answer
          .replaceAll("\u200d", "\n")
          .split(/\n+/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean);

        return (
          <div
            key={`${item.question}-${index}`}
            className={`bftp-faq-accordion__item${isOpen ? " is-open" : ""}`}
          >
            <button
              type="button"
              className="bftp-faq-accordion__trigger"
              aria-expanded={isOpen}
              onClick={() => {
                setOpenItems((current) => {
                  const next = new Set(current);

                  if (next.has(index)) {
                    next.delete(index);
                  } else {
                    next.add(index);
                    posthog?.capture("faq_expanded", {
                      question: item.question,
                      index,
                    });
                  }

                  return next;
                });
              }}
            >
              <span className="bftp-faq-accordion__question">{item.question}</span>
              <span className="bftp-faq-accordion__icon" aria-hidden="true">
                +
              </span>
            </button>
            <div className="bftp-faq-accordion__panel">
              <div className="bftp-faq-accordion__content">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph} className="bftp-faq-accordion__paragraph">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
