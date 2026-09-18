"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";

import { serviceOptions } from "@/lib/contact-intake";
import { siteConfig } from "@/lib/site-config";

/**
 * The quiz's first question, asked where people land.
 *
 * Most visitors read one page and leave without ever opening the contact
 * page, while the quiz itself loses almost nobody once it is started. A tap
 * here answers the service question and carries it to the contact page, which
 * then skips straight past it. The event is the same one the quiz fires, so a
 * homepage answer counts as a started quiz rather than a separate number.
 */
export function HeroServiceChips() {
  const posthog = usePostHog();

  return (
    <div className="bftp-hero-chips" role="group" aria-labelledby="bftp-hero-chips-label">
      <p id="bftp-hero-chips-label" className="bftp-hero-chips__label">
        What do you need?
      </p>
      <div className="bftp-hero-chips__options">
        {serviceOptions.map(([value, short]) => (
          <Link
            key={value}
            href={`${siteConfig.contactPath}?service=${encodeURIComponent(value)}`}
            className="bftp-hero-chips__option"
            onClick={() =>
              posthog?.capture("contact_quiz_option_selected", {
                step: "serviceType",
                value,
                location: "homepage-hero",
              })
            }
          >
            {short}
          </Link>
        ))}
      </div>
    </div>
  );
}
