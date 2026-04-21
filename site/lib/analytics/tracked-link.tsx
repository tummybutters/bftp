"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";

interface TrackedLinkProps {
  href: string;
  event: string;
  properties?: Record<string, string | number | boolean>;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
  target?: string;
}

export function TrackedLink({
  href,
  event,
  properties,
  className,
  children,
  external,
  target,
}: TrackedLinkProps) {
  const posthog = usePostHog();

  const handleClick = () => {
    posthog?.capture(event, { href, ...properties });
  };

  if (external || href.startsWith("http") || href.startsWith("tel:")) {
    return (
      <a
        href={href}
        className={className}
        target={target || (external ? "_blank" : undefined)}
        rel={external ? "noreferrer" : undefined}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
