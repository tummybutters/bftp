"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePostHog } from "posthog-js/react";

import { brandAssets, featureIcons } from "@/lib/design";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/about-us", label: "About" },
  { href: "/backflow-testing", label: "Backflow Testing" },
  {
    href: "/backflow-repair-replacement-services",
    label: "Backflow Repair",
  },
  { href: "/backflow-installation", label: "Backflow Installation" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const posthog = usePostHog();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const phoneIcon = featureIcons.find((icon) => icon.key === "phone");
  const emailIcon = featureIcons.find((icon) => icon.key === "email");
  const promoIcon = featureIcons.find((icon) => icon.key === "promoGift");

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
    <header className="sticky top-0 z-40 bftp-site-header">
      <div className="bftp-topbar">
        <div className="bftp-shell bftp-topbar__inner">
          <Link href="/contact-backflowtestpros" className="bftp-topbar__promo" onClick={() => posthog?.capture("promo_banner_clicked", { label: "Qualify for Free Backflow Repair Coverage" })}>
            {promoIcon ? (
              <Image
                src={promoIcon.src}
                alt={promoIcon.alt}
                width={22}
                height={22}
                className="bftp-topbar__icon"
              />
            ) : null}
            <span>Qualify for Free Backflow Repair Coverage</span>
          </Link>
          <div className="bftp-topbar__actions">
            <a href="tel:18008036658" className="bftp-topbar__item" onClick={() => posthog?.capture("phone_cta_clicked", { location: "header-topbar", phone_number: "18008036658" })}>
              {phoneIcon ? (
                <Image
                  src={phoneIcon.src}
                  alt={phoneIcon.alt}
                  width={18}
                  height={18}
                  className="bftp-topbar__icon"
                />
              ) : null}
              <span>(800) 803-6658</span>
            </a>
            <Link href="/contact-backflowtestpros" className="bftp-topbar__item" onClick={() => posthog?.capture("contact_cta_clicked", { location: "header-topbar", label: "Contact Us" })}>
              {emailIcon ? (
                <Image
                  src={emailIcon.src}
                  alt={emailIcon.alt}
                  width={18}
                  height={18}
                  className="bftp-topbar__icon"
                />
              ) : null}
              <span>Contact Us</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="bftp-navbar">
        <div className="bftp-shell bftp-navbar__inner">
          <Link href="/" className="bftp-navbar__brand" aria-label="Backflow Test Pros home">
            <Image
              src={brandAssets.navLogo.src}
              alt={brandAssets.navLogo.alt}
              width={254}
              height={40}
              priority
            />
          </Link>
          <nav className="bftp-navbar__menu">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`bftp-navbar__link${
                  isActivePath(pathname, link.href) ? " is-active" : ""
                }`}
                onClick={() => posthog?.capture("nav_link_clicked", { label: link.label, href: link.href, is_mobile: false })}
              >
                <span className="bftp-navbar__link-label">{link.label}</span>
              </Link>
            ))}
          </nav>
          <div className="bftp-navbar__cta-wrap">
            <a href="tel:18008036658" className="bftp-navbar__cta bftp-cta-button" onClick={() => posthog?.capture("phone_cta_clicked", { location: "header-navbar", phone_number: "18008036658" })}>
              {phoneIcon ? (
                <Image
                  src={phoneIcon.src}
                  alt={phoneIcon.alt}
                  width={18}
                  height={18}
                  className="bftp-navbar__cta-icon"
                />
              ) : null}
              <span>(800) 803-6658</span>
            </a>
          </div>
          <div className="bftp-navbar__mobile-controls">
            <button
              type="button"
              className={`bftp-navbar__toggle${mobileMenuOpen ? " is-open" : ""}`}
              aria-expanded={mobileMenuOpen}
              aria-controls="bftp-mobile-menu"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => {
                const willOpen = !mobileMenuOpen;
                posthog?.capture("mobile_menu_toggled", { action: willOpen ? "open" : "close" });
                setMobileMenuOpen(willOpen);
              }}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
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
                  {primaryLinks.map((link) => (
                    <Link
                  key={link.href}
                  href={link.href}
                  className={`bftp-navbar__mobile-link${
                    isActivePath(pathname, link.href) ? " is-active" : ""
                  }`}
                  onClick={() => {
                    posthog?.capture("nav_link_clicked", { label: link.label, href: link.href, is_mobile: true });
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="bftp-navbar__mobile-link-text">{link.label}</span>
                  <span className="bftp-navbar__mobile-link-mark" aria-hidden="true" />
                </Link>
                  ))}
                </nav>
                <div className="bftp-navbar__mobile-actions">
                  <a href="tel:18008036658" className="bftp-navbar__mobile-phone bftp-cta-button" onClick={() => posthog?.capture("phone_cta_clicked", { location: "mobile-menu", phone_number: "18008036658" })}>
                    {phoneIcon ? (
                      <Image
                        src={phoneIcon.src}
                        alt={phoneIcon.alt}
                        width={18}
                        height={18}
                        className="bftp-navbar__cta-icon"
                      />
                    ) : null}
                    <span>(800) 803-6658</span>
                  </a>
                  <Link
                    href="/contact-backflowtestpros"
                    className="bftp-navbar__mobile-contact"
                    onClick={() => {
                      posthog?.capture("contact_cta_clicked", { location: "mobile-menu", label: "Contact Us" });
                      setMobileMenuOpen(false);
                    }}
                  >
                    {emailIcon ? (
                      <Image
                        src={emailIcon.src}
                        alt={emailIcon.alt}
                        width={18}
                        height={18}
                        className="bftp-navbar__mobile-contact-icon"
                      />
                    ) : null}
                    <span>Contact Us</span>
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
