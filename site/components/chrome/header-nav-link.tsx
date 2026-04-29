"use client";

import { usePathname } from "next/navigation";

import { TrackedLink } from "@/lib/analytics";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/backflow-testing-installation-repair-service-areas") {
    return (
      pathname === href ||
      pathname.endsWith("-backflow-testing-installation-repair-service-areas")
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNavLink({
  href,
  label,
  mobile = false,
  onNavigate,
}: {
  href: string;
  label: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href);

  if (mobile) {
    return (
      <TrackedLink
        href={href}
        event="nav_link_clicked"
        properties={{ label, is_mobile: true }}
        className={`bftp-navbar__mobile-link${isActive ? " is-active" : ""}`}
        onClick={onNavigate}
      >
        <span className="bftp-navbar__mobile-link-text">{label}</span>
        <span className="bftp-navbar__mobile-link-mark" aria-hidden="true" />
      </TrackedLink>
    );
  }

  return (
    <TrackedLink
      href={href}
      event="nav_link_clicked"
      properties={{ label, is_mobile: false }}
      className={`bftp-navbar__link${isActive ? " is-active" : ""}`}
    >
      <span className="bftp-navbar__link-label">{label}</span>
    </TrackedLink>
  );
}
