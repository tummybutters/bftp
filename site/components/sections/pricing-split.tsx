"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";

interface PricingSplitProps {
  heading: string;
  body: string;
  items: Array<{
    label: string;
    price: string;
    detail: string;
  }>;
  calloutLabel?: string;
  calloutHref?: string;
}

function splitBody(body: string) {
  return body
    .replaceAll("\u200d", "\n")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
}

export function PricingSplit({
  heading,
  body,
  items,
  calloutLabel,
  calloutHref,
}: PricingSplitProps) {
  const posthog = usePostHog();
  const paragraphs = splitBody(body);

  return (
    <div className="bftp-price-split">
      <div className="bftp-price-split__text">
        <h2 className="bftp-price-split__heading">{heading}</h2>
        {paragraphs.map((p) => (
          <p key={p} className="bftp-price-split__copy">{p}</p>
        ))}
        {calloutLabel && calloutHref ? (
          <Link
            href={calloutHref}
            className="bftp-cta-button"
            onClick={() =>
              posthog?.capture("pricing_callout_clicked", {
                label: calloutLabel,
                href: calloutHref,
              })
            }
          >
            {calloutLabel}
          </Link>
        ) : null}
      </div>
      <div className="bftp-price-split__cards">
        {items.map((item, index) => (
          <article
            key={`${item.label}-${index}`}
            className={
              index === 1
                ? "bftp-price-split__card bftp-price-split__card--featured"
                : "bftp-price-split__card"
            }
          >
            <span className="bftp-price-split__amount">{item.price}</span>
            <div className="bftp-price-split__meta">
              <h3 className="bftp-price-split__label">{item.label}</h3>
              {item.detail ? (
                <p className="bftp-price-split__detail">{item.detail}</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
