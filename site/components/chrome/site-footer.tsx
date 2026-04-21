import Image from "next/image";
import Link from "next/link";

import { TrackedLink } from "@/lib/analytics";
import { brandAssets, socialIcons } from "@/lib/design";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
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
            {siteConfig.footerCopy.map((paragraph) => (
              <p key={paragraph} className="bftp-footer__brand-copy">
                {paragraph}
              </p>
            ))}
            <div className="bftp-footer__social">
              {socialIcons.map((icon) => (
                <TrackedLink
                  key={icon.key}
                  href={siteConfig.contactPath}
                  event="footer_social_clicked"
                  properties={{ platform: icon.alt }}
                  className="bftp-footer__social-link"
                >
                  <Image src={icon.src} alt={icon.alt} width={20} height={20} />
                </TrackedLink>
              ))}
            </div>
          </div>
        </div>
        <div className="bftp-footer__offices">
          {siteConfig.offices.map((office) => (
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
            {siteConfig.footerNavigation.map((page) => (
              <TrackedLink
                key={page.href}
                href={page.href}
                event="footer_link_clicked"
                properties={{ label: page.label, column: "pages" }}
                className="bftp-footer__link"
              >
                {page.label}
              </TrackedLink>
            ))}
          </div>
          <div className="bftp-footer__nav-column">
            <h2 className="bftp-footer__heading">California Local Water Authorities</h2>
            {siteConfig.footerAuthorities.map((item) => (
              <p key={item} className="bftp-footer__meta">
                {item}
              </p>
            ))}
          </div>
          <div className="bftp-footer__nav-column">
            <h2 className="bftp-footer__heading">
              California Local County Water Regulations
            </h2>
            {siteConfig.footerRegulations.map((item) => (
              <p key={item} className="bftp-footer__meta">
                {item}
              </p>
            ))}
          </div>
        </div>
        <div className="bftp-footer__bottom">
          Copyright © {new Date().getFullYear()} {siteConfig.name}
        </div>
      </div>
    </footer>
  );
}
