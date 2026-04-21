import Image from "next/image";

import { heroImages } from "@/lib/design";
import { TrackedHeroCta } from "@/components/sections/tracked-hero-cta";
import { TrackedHeroDetails } from "@/components/sections/tracked-hero-details";

interface ActionLink {
  href: string;
  label: string;
}

function splitHeroTitle(title: string) {
  const normalized = title.replace(/\s+/g, " ").trim();

  if (normalized === "SoCals Premier Backflow Installation, Testing & Repair") {
    return {
      primary: "SoCals Premier Backflow",
      accent: "Installation, Testing & Repair",
    };
  }

  if (!normalized.includes(" ")) {
    return {
      primary: normalized,
      accent: "",
    };
  }

  const patterns = [
    /^(.*?Installation,)(\s+Testing\s+&\s+Repair)$/i,
    /^(Backflow Prevention)(\s+Installation Testing\s+&\s+Repair Service Areas)$/i,
    /^(.*?)(\s+Backflow Testing\s+&\s+Installation)$/i,
    /^(.*? Backflow Testing)(\s+Installation\s+&\s+Repair Services)$/i,
    /^(.*? Backflow(?: Preventer)?)(\s+Installation Testing\s+&\s+Repair(?: Service Areas)?)$/i,
    /^(.*? County)(\s+Backflow Installation Testing Repair)$/i,
    /^(.*?)(\s+Backflow (?:Installation|Repair|Testing) Services)$/i,
    /^(.*?)(\s+Frequently Asked Questions)$/i,
    /^(.*?)(\s+Cross Connection Control\s+&\s+Backflow Prevention Regulations)$/i,
    /^(Contact)(\s+Us)$/i,
    /^(Privacy)(\s+policy)$/i,
    /^(.*? Installation)(\s+Testing\s+&\s+Repair)$/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (match) {
      return {
        primary: match[1].trim(),
        accent: match[2].trim(),
      };
    }
  }

  const tokens = normalized.split(" ");
  const pivot = Math.min(
    tokens.length - 2,
    Math.max(2, Math.round(tokens.length * 0.58)),
  );

  return {
    primary: tokens.slice(0, pivot).join(" "),
    accent: tokens.slice(pivot).join(" "),
  };
}

function normalizeHeroText(value?: string) {
  return value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
}

interface PageHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  bodyLines?: string[];
  promoText?: string;
  badges?: string[];
  primaryAction?: ActionLink;
  heroVariant?: "photo" | "navy";
  heroImageSrc?: string;
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  bodyLines,
  promoText,
  badges = [],
  primaryAction,
  heroVariant = "photo",
  heroImageSrc = heroImages[0]?.src,
}: PageHeroProps) {
  const isPhonePrimaryAction = primaryAction?.href.startsWith("tel:") ?? false;
  const primaryActionClassName = isPhonePrimaryAction
    ? "bftp-cta-button bftp-hero__phone"
    : "bftp-cta-button";
  const heroCopyLines = bodyLines?.length ? bodyLines : subtitle ? [subtitle] : [];
  const previewCopyLines = heroCopyLines.slice(0, 1);
  const expandedCopyLines = heroCopyLines.slice(1);
  const { primary: titlePrimary, accent: titleAccent } = splitHeroTitle(title);
  const normalizedSubtitle = normalizeHeroText(subtitle);
  const normalizedPreviewLine = normalizeHeroText(previewCopyLines[0]);
  const hasRealBodyLines = bodyLines && bodyLines.length > 0;
  const showSubtitle =
    !hasRealBodyLines &&
    Boolean(subtitle) &&
    normalizedSubtitle.length > 0 &&
    normalizedSubtitle !== normalizeHeroText(title) &&
    normalizedSubtitle !== normalizedPreviewLine;
  const isLongHeroTitle =
    titlePrimary.length > 34 || titleAccent.length > 40;
  const isVeryLongHeroTitle =
    titlePrimary.length > 42 || titleAccent.length > 52;
  const showPhotoHero = heroVariant !== "navy" && Boolean(heroImageSrc);

  return (
    <section className={heroVariant === "navy" ? "bftp-hero bftp-hero--navy" : "bftp-hero"}>
      {showPhotoHero ? (
        <div className="bftp-hero__media" aria-hidden="true">
          <Image
            src={heroImageSrc!}
            alt=""
            fill
            priority
            sizes="100vw"
            className="bftp-hero__media-image"
          />
        </div>
      ) : null}
      <div className="bftp-shell">
        <div className="bftp-hero__inner">
          <div className="bftp-hero__content">
            {eyebrow ? <p className="bftp-kicker">{eyebrow}</p> : null}
            <h1
              className={`bftp-hero__title${
                isLongHeroTitle ? " bftp-hero__title--long" : ""
              }${isVeryLongHeroTitle ? " bftp-hero__title--very-long" : ""}`}
            >
              <span className="bftp-hero__title-line bftp-hero__title-line--primary">
                {titlePrimary}
              </span>
              {titleAccent ? (
                <span className="bftp-hero__title-line bftp-hero__title-line--accent">
                  {titleAccent}
                </span>
              ) : null}
            </h1>
            {showSubtitle ? (
              <p className="bftp-hero__subtitle">{subtitle}</p>
            ) : null}
            {expandedCopyLines.length > 0 ? (
              <div className="bftp-hero__copy-details">
                <div className="bftp-hero__copy bftp-hero__copy--preview">
                  {previewCopyLines.map((line, index) => (
                    <p key={`${index}-${line}`}>{line}</p>
                  ))}
                </div>
                <TrackedHeroDetails className="bftp-hero__copy-expand">
                  <summary className="bftp-hero__copy-summary">
                    <span className="bftp-hero__copy-summary-label bftp-hero__copy-summary-label--closed">
                      Read More
                    </span>
                    <span className="bftp-hero__copy-summary-label bftp-hero__copy-summary-label--open">
                      Show Less
                    </span>
                  </summary>
                  <div className="bftp-hero__copy bftp-hero__copy--expanded">
                    {expandedCopyLines.map((line, index) => (
                      <p key={`${index}-${line}`}>{line}</p>
                    ))}
                  </div>
                </TrackedHeroDetails>
              </div>
            ) : (
              <div className="bftp-hero__copy">
                {heroCopyLines.map((line, index) => (
                  <p key={`${index}-${line}`}>{line}</p>
                ))}
              </div>
            )}
            {promoText ? <p className="bftp-hero__promo">{promoText}</p> : null}
            {badges.length > 0 ? (
              <div className="bftp-hero__badges">
                {badges.map((badge) => (
                  <span key={badge} className="badge-pill">
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
            {primaryAction ? (
              <div className="bftp-hero__actions">
                <TrackedHeroCta
                  href={primaryAction.href}
                  label={primaryAction.label}
                  className={primaryActionClassName}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
