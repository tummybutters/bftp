"use client";

import { useState } from "react";

interface ServiceAccordionItem {
  title: string;
  body: string;
}

// Deprecated shared variant retained on disk for possible future reuse.

function truncateBody(body: string, maxSentences = 3) {
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.slice(0, maxSentences).join(" ");
}

export function ServiceAccordion({ items }: { items: ServiceAccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <div className="bftp-svc-accordion">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={`${item.title}-${index}`}
            className={`bftp-svc-accordion__item${isOpen ? " is-open" : ""}`}
          >
            <button
              type="button"
              className="bftp-svc-accordion__trigger"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="bftp-svc-accordion__number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="bftp-svc-accordion__heading">{item.title}</span>
              <span className="bftp-svc-accordion__chevron" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <div className="bftp-svc-accordion__panel">
              <div className="bftp-svc-accordion__content">
                <p>{truncateBody(item.body)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
