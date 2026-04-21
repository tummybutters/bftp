"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePostHog } from "posthog-js/react";

import { HeaderNavLink } from "@/components/chrome/header-nav-link";
import { TrackedLink } from "@/lib/analytics";
import { siteConfig, siteIcons } from "@/lib/site-config";

export function SiteHeaderMobileMenu() {
  const posthog = usePostHog();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <div className="bftp-navbar__mobile-controls">
        <button
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
            id="bftp-mobile-menu"
            className="bftp-navbar__mobile-panel is-open"
            aria-hidden={false}
          >
            <div className="bftp-navbar__mobile-surface">
              <nav className="bftp-navbar__mobile-menu" aria-label="Mobile navigation">
                {siteConfig.primaryNavigation.map((link) => (
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
                  <Image
                    src={siteIcons.phone.src}
                    alt={siteIcons.phone.alt}
                    width={18}
                    height={18}
                    className="bftp-navbar__cta-icon"
                  />
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
