import Image from "next/image";
import Link from "next/link";

import { HeaderNavLink } from "@/components/chrome/header-nav-link";
import { SiteHeaderMobileMenu } from "@/components/chrome/site-header-mobile-menu";
import { TrackedLink } from "@/lib/analytics";
import { brandAssets } from "@/lib/design";
import { siteConfig, siteIcons } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bftp-site-header">
      <div className="bftp-topbar">
        <div className="bftp-shell bftp-topbar__inner">
          <TrackedLink
            href={siteConfig.promoBanner.href}
            event="promo_banner_clicked"
            properties={{ label: siteConfig.promoBanner.label }}
            className="bftp-topbar__promo"
          >
            <Image
              src={siteIcons.promoGift.src}
              alt={siteIcons.promoGift.alt}
              width={22}
              height={22}
              className="bftp-topbar__icon"
            />
            <span>{siteConfig.promoBanner.label}</span>
          </TrackedLink>
          <div className="bftp-topbar__actions">
            <TrackedLink
              href={siteConfig.phone.href}
              event="phone_cta_clicked"
              properties={{
                location: "header-topbar",
                phone_number: siteConfig.phone.raw,
              }}
              className="bftp-topbar__item"
            >
              <Image
                src={siteIcons.phone.src}
                alt={siteIcons.phone.alt}
                width={18}
                height={18}
                className="bftp-topbar__icon"
              />
              <span>{siteConfig.phone.display}</span>
            </TrackedLink>
            <TrackedLink
              href={siteConfig.contactPath}
              event="contact_cta_clicked"
              properties={{ location: "header-topbar", label: "Contact Us" }}
              className="bftp-topbar__item"
            >
              <Image
                src={siteIcons.email.src}
                alt={siteIcons.email.alt}
                width={18}
                height={18}
                className="bftp-topbar__icon"
              />
              <span>Contact Us</span>
            </TrackedLink>
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
            {siteConfig.primaryNavigation.map((link) => (
              <HeaderNavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>
          <SiteHeaderMobileMenu />
        </div>
      </div>
    </header>
  );
}
