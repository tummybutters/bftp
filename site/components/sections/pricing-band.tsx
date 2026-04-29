"use client";

import { TrackedLink } from "@/lib/analytics";
import { siteConfig } from "@/lib/site-config";

interface PricingBandProps {
  items: Array<{
    label: string;
    price: string;
    detail: string;
  }>;
}

function buildPricingInquiryHref(label: string) {
  const params = new URLSearchParams({
    topic: label,
    details: `I'm interested in ${label}. Please send me pricing and next steps.`,
  });

  return `${siteConfig.contactPath}?${params.toString()}`;
}

export function PricingBand({
  items,
}: PricingBandProps) {
  return (
    <div className="bftp-pricing">
      <div className="bftp-pricing__grid">
        {items.map((item, index) => (
          <article key={`${item.label}-${index}`} className="bftp-pricing__item">
            <TrackedLink
              href={buildPricingInquiryHref(item.label)}
              event="pricing_option_clicked"
              properties={{ label: item.label, price: item.price || "custom" }}
              className="bftp-pricing__item-link"
            >
              <div className="bftp-pricing__diamond">
                <div className="bftp-pricing__diamond-copy">
                  {item.price ? <p className="bftp-pricing__value">{item.price}</p> : null}
                  <p className="bftp-pricing__label">{item.label}</p>
                  {item.detail ? <p className="bftp-pricing__note">{item.detail}</p> : null}
                </div>
              </div>
            </TrackedLink>
          </article>
        ))}
      </div>
    </div>
  );
}
