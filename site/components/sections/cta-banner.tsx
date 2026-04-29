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

function splitBannerHeading(heading: string) {
  const normalized = heading.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return { primary: "", accent: "" };
  }

  const withMatch = normalized.match(/^(.*?\bwith)\s+(.*)$/i);

  if (withMatch) {
    return {
      primary: withMatch[1].trim(),
      accent: withMatch[2].trim(),
    };
  }

  const tokens = normalized.split(" ");

  if (tokens.length < 5) {
    return { primary: normalized, accent: "" };
  }

  const pivot = Math.max(2, Math.ceil(tokens.length / 2));

  return {
    primary: tokens.slice(0, pivot).join(" "),
    accent: tokens.slice(pivot).join(" "),
  };
}

export function CtaBanner({
  heading,
  body,
  ctaLabel,
  ctaHref,
  backgroundSrc,
}: CtaBannerProps) {
  const posthog = usePostHog();
  const { primary, accent } = splitBannerHeading(heading);

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
            <h2 className="bftp-cta-banner__title">
              <span className="bftp-cta-banner__title-line bftp-cta-banner__title-line--primary">
                {primary}
              </span>
              {accent ? (
                <span className="bftp-cta-banner__title-line bftp-cta-banner__title-line--accent">
                  {accent}
                </span>
              ) : null}
            </h2>
            <p className="bftp-cta-banner__body">{body}</p>
          </div>
          {ctaLabel && ctaHref ? (
            <div className="bftp-cta-banner__actions">
              <Link
                href={ctaHref}
                className="bftp-cta-button bftp-cta-banner__button"
                onClick={() =>
                  posthog?.capture("cta_banner_clicked", {
                    heading,
                    label: ctaLabel,
                    href: ctaHref,
                  })
                }
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
