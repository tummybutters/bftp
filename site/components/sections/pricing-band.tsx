"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";

interface PricingBandProps {
  items: Array<{
    label: string;
    price: string;
    detail: string;
  }>;
  calloutLabel?: string;
  calloutHref?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function PricingBand({
  items,
  calloutLabel,
  calloutHref,
  ctaLabel,
  ctaHref,
}: PricingBandProps) {
  const posthog = usePostHog();

  return (
    <div className="bftp-pricing">
      <div className="bftp-pricing__grid">
        {items.map((item, index) => (
          <article key={`${item.label}-${index}`} className="bftp-pricing__item">
            <div
              className={
                index === 1
                  ? "bftp-pricing__diamond bftp-pricing__diamond--accent"
                  : "bftp-pricing__diamond"
              }
            >
              <div className="bftp-pricing__diamond-copy">
                {item.price ? <p className="bftp-pricing__value">{item.price}</p> : null}
                <p className="bftp-pricing__label">{item.label}</p>
                {item.detail ? <p className="bftp-pricing__note">{item.detail}</p> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      {calloutLabel && calloutHref ? (
        <div className="bftp-pricing__callout">
          <Link
            href={calloutHref}
            onClick={() => posthog?.capture("pricing_callout_clicked", { label: calloutLabel, href: calloutHref })}
          >
            {calloutLabel}
          </Link>
        </div>
      ) : null}
      {ctaLabel && ctaHref ? (
        <div className="bftp-pricing__actions">
          <Link
            href={ctaHref}
            className="bftp-cta-button"
            onClick={() => posthog?.capture("pricing_cta_clicked", { label: ctaLabel, href: ctaHref })}
          >
            {ctaLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
