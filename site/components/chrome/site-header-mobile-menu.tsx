"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePostHog } from "posthog-js/react";

import { HeaderNavLink } from "@/components/chrome/header-nav-link";
import { HeaderMobileServicesDropdown } from "@/components/chrome/header-services-dropdown";
import { TrackedLink } from "@/lib/analytics";
import { siteConfig, siteIcons } from "@/lib/site-config";

export function SiteHeaderMobileMenu() {
  const posthog = usePostHog();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [homeLink, ...remainingLinks] = siteConfig.primaryNavigation;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1120px)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMobileMenuOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    panelRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        toggleRef.current?.focus({ preventScroll: true });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <div className="bftp-navbar__mobile-controls">
        <button
          ref={toggleRef}
          type="button"
          className={`bftp-navbar__toggle${mobileMenuOpen ? " is-open" : ""}`}
          aria-expanded={mobileMenuOpen}
          aria-controls="bftp-mobile-menu"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => {
            const willOpen = !mobileMenuOpen;
            posthog?.capture("mobile_menu_toggled", {
              action: willOpen ? "open" : "close",
            });
            setMobileMenuOpen(willOpen);
          }}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      {mobileMenuOpen ? (
        <>
          <button
            type="button"
            className="bftp-navbar__mobile-backdrop is-open"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            ref={panelRef}
            id="bftp-mobile-menu"
            className="bftp-navbar__mobile-panel is-open"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            tabIndex={-1}
          >
            <div className="bftp-navbar__mobile-surface">
              <nav className="bftp-navbar__mobile-menu" aria-label="Mobile navigation">
                {homeLink ? (
                  <HeaderNavLink
                    href={homeLink.href}
                    label={homeLink.label}
                    mobile
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                ) : null}
                <HeaderMobileServicesDropdown onNavigate={() => setMobileMenuOpen(false)} />
                {remainingLinks.map((link) => (
                  <HeaderNavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    mobile
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                ))}
              </nav>
              <div className="bftp-navbar__mobile-actions">
                <TrackedLink
                  href={siteConfig.phone.href}
                  event="phone_cta_clicked"
                  properties={{
                    location: "mobile-menu",
                    phone_number: siteConfig.phone.raw,
                  }}
                  className="bftp-navbar__mobile-phone bftp-cta-button"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{siteConfig.phone.display}</span>
                </TrackedLink>
                <TrackedLink
                  href={siteConfig.contactPath}
                  event="contact_cta_clicked"
                  properties={{ location: "mobile-menu", label: "Contact Us" }}
                  className="bftp-navbar__mobile-contact"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Image
                    src={siteIcons.email.src}
                    alt={siteIcons.email.alt}
                    width={18}
                    height={18}
                    className="bftp-navbar__mobile-contact-icon"
                  />
                  <span>Contact Us</span>
                </TrackedLink>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
