"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";

export function TrackedHeroCta({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  const posthog = usePostHog();
  const isPhone = href.startsWith("tel:");

  const handleClick = () => {
    posthog?.capture(isPhone ? "phone_cta_clicked" : "hero_cta_clicked", {
      location: "hero",
      label,
      href,
      is_phone: isPhone,
    });
  };

  if (isPhone) {
    return (
      <a href={href} className={className} onClick={handleClick}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {label}
    </Link>
  );
}
