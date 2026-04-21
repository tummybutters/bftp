"use client";

import Image from "next/image";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";

import { brandAssets, socialIcons } from "@/lib/design";

const pages = [
  { href: "/", label: "Home" },
  { href: "/about-us", label: "About Us" },
  { href: "/backflow-testing", label: "Backflow Preventer Testing" },
  { href: "/backflow-installation", label: "Backflow Preventer Installations" },
  {
    href: "/backflow-repair-replacement-services",
    label: "Backflow Preventer Repairs Replacements",
  },
  {
    href: "/orange-county-backflow-testing-installation-repair-service-areas",
    label: "Backflow Installation Testing & Repairs Service Areas",
  },
  { href: "/contact-backflowtestpros", label: "Contact Us" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

const authorities = [
  "Los Angeles County Water Departments",
  "Ventura County Water Departments",
  "Orange County Water Departments",
  "Riverside County Water Departments",
  "San Diego County Water Departments",
];

const regulations = [
  "Orange County Backflow Regulations",
  "Los Angeles County Backflow Regulations",
];

const offices = [
  {
    heading: "Los Angeles County",
    lines: [
      "Backflow Test Pros - LA",
      "1150 S Olive St, 10th Floor",
      "Los Angeles, CA 90015",
      "(310) 753-7325",
      "7AM-8 PM Mon.-Fri.",
      "9AM-5 PM Sat. & Sun",
    ],
  },
  {
    heading: "Orange County",
    lines: [
      "Backflow Test Pros - OC",
      "2211 Michelson Dr, 9th Floor",
      "Irvine, CA 92612",
      "(714) 852-1213",
      "7AM-8 PM Mon.-Fri.",
      "9AM-5 PM Sat. & Sun",
    ],
  },
  {
    heading: "San Diego County",
    lines: [
      "Backflow Test Pros - San Diego",
      "600 B Street, Suite 300",
      "San Diego, CA 92101",
      "(619) 415-6937",
      "7AM-8 PM Mon.-Fri.",
      "9AM-5 PM Sat. & Sun",
    ],
  },
];

export function SiteFooter() {
  const posthog = usePostHog();
  return (
    <footer className="bftp-footer">
      <div className="bftp-shell">
        <div className="bftp-footer__brand-band">
          <div className="bftp-footer__brand">
            <Link href="/" aria-label="Backflow Test Pros home">
              <Image
                src={brandAssets.footerLogo.src}
                alt={brandAssets.footerLogo.alt}
                width={150}
                height={150}
              />
            </Link>
          </div>
          <div>
            <p className="bftp-footer__brand-copy">
              Backflow Test Pros is a bonded and insured CA Licensed Contractor and
              American Water Works Association (AWWA) Certified Cross Connection
              Control + Backflow Testing Specialist 100% dedicated to helping
              Southern California property owners meet backflow prevention
              compliance requirements.
            </p>
            <p className="bftp-footer__brand-copy">
              With a reputation built on expertise, integrity, and customer
              satisfaction; Backflow Test Pros manages your backflow prevention
              concerns so you can avoid water service interruptions and liabilities.
            </p>
            <div className="bftp-footer__social">
              {socialIcons.map((icon) => (
                <Link
                  key={icon.key}
                  href="/contact-backflowtestpros"
                  aria-label={icon.alt}
                  className="bftp-footer__social-link"
                  onClick={() => posthog?.capture("footer_social_clicked", { platform: icon.alt })}
                >
                  <Image src={icon.src} alt={icon.alt} width={20} height={20} />
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="bftp-footer__offices">
          {offices.map((office) => (
            <div key={office.heading} className="bftp-footer__office">
              <h2 className="bftp-footer__office-heading">{office.heading}</h2>
              {office.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="bftp-footer__nav-grid">
          <div className="bftp-footer__nav-column">
            <h2 className="bftp-footer__heading">Pages</h2>
            {pages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="bftp-footer__link"
                onClick={() => posthog?.capture("footer_link_clicked", { label: page.label, href: page.href, column: "pages" })}
              >
                {page.label}
              </Link>
            ))}
          </div>
          <div className="bftp-footer__nav-column">
            <h2 className="bftp-footer__heading">California Local Water Authorities</h2>
            {authorities.map((item) => (
              <p key={item} className="bftp-footer__meta">
                {item}
              </p>
            ))}
          </div>
          <div className="bftp-footer__nav-column">
            <h2 className="bftp-footer__heading">
              California Local County Water Regulations
            </h2>
            {regulations.map((item) => (
              <p key={item} className="bftp-footer__meta">
                {item}
              </p>
            ))}
          </div>
        </div>
        <div className="bftp-footer__bottom">
          Copyright © 2025 Backflow Test Pros
        </div>
      </div>
    </footer>
  );
}
