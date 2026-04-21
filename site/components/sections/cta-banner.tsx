"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";

interface CtaBannerProps {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  backgroundSrc?: string;
}

export function CtaBanner({
  heading,
  body,
  ctaLabel,
  ctaHref,
  backgroundSrc,
}: CtaBannerProps) {
  const posthog = usePostHog();

  return (
    <section className="bftp-band bftp-band--plain">
      <div className="bftp-shell">
        <div
          className="bftp-cta-banner"
          style={
            backgroundSrc
              ? ({ "--bftp-banner-image": `url(${backgroundSrc})` } as CSSProperties)
              : undefined
          }
        >
          <div className="bftp-cta-banner__copy">
            <h2 className="bftp-cta-banner__title">{heading}</h2>
            <p className="bftp-cta-banner__body">{body}</p>
          </div>
          {ctaLabel && ctaHref ? (
            <div className="bftp-cta-banner__actions">
              <Link
                href={ctaHref}
                className="bftp-cta-button"
                onClick={() => posthog?.capture("cta_banner_clicked", { heading, label: ctaLabel, href: ctaHref })}
              >
                {ctaLabel}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
