"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { authorityLogos, brandAssets } from "@/lib/design";
import type { LinkItem, PageEntry } from "@/lib/site-schema";

function getAuthorityLogo(page: PageEntry, heading: string) {
  const countyLabel = `${page.countyLabel ?? ""} ${heading}`.toLowerCase();

  if (countyLabel.includes("orange county")) {
    return (
      authorityLogos.find((logo) => logo.key === "orangeCountyWaterDistrict") ??
      brandAssets.footerLogo
    );
  }

  if (countyLabel.includes("los angeles county") || countyLabel.includes("la county")) {
    return (
      authorityLogos.find((logo) => logo.key === "losAngelesCountyWaterworks") ??
      brandAssets.footerLogo
    );
  }

  return brandAssets.footerLogo;
}

function getDirectoryMeta(heading: string, count: number) {
  const lowerHeading = heading.toLowerCase();

  if (/requirement|resource|regulation|district/.test(lowerHeading)) {
    return {
      eyebrow: "Resource Directory",
      countLabel: `${count} resources`,
      summarySubject: heading,
    };
  }

  if (/service area|services near you|service directory/.test(lowerHeading)) {
    return {
      eyebrow: "Service Directory",
      countLabel: `${count} cities`,
      summarySubject: heading,
    };
  }

  return {
    eyebrow: "Directory",
    countLabel: `${count} entries`,
    summarySubject: heading,
  };
}

function getSummaryCopy(page: PageEntry, heading: string) {
  const meta = getDirectoryMeta(heading, 0);
  const countyName =
    page.countyLabel ??
    meta.summarySubject
      .replace(/\s+installation service areas?/i, "")
      .replace(/\s+testing installation and repair service areas?/i, "")
      .trim();

  if (meta.eyebrow === "Resource Directory") {
    return `Municipal requirement references and water authority links collected for ${countyName}.`;
  }

  if (meta.eyebrow === "Service Directory") {
    return `Browse city pages across ${countyName} for testing, installation, repair, and compliance support.`;
  }

  return `Browse local directory entries across ${countyName}.`;
}

function splitIntoColumns(items: LinkItem[], columnCount: number) {
  const size = Math.ceil(items.length / columnCount);
  return Array.from({ length: columnCount }, (_, index) =>
    items.slice(index * size, index * size + size),
  ).filter((column) => column.length > 0);
}

export function ServiceAreaDirectory({
  page,
  heading,
  items,
  hideLogos = false,
  defaultExpanded = false,
  hideToggle = false,
}: {
  page: PageEntry;
  heading: string;
  items: LinkItem[];
  hideLogos?: boolean;
  defaultExpanded?: boolean;
  hideToggle?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const authorityLogo = getAuthorityLogo(page, heading);
  const count = items.length;
  const directoryMeta = getDirectoryMeta(heading, count);
  const isExpanded = hideToggle || expanded;
  const columns = useMemo(() => {
    if (items.length >= 54) {
      return splitIntoColumns(items, 4);
    }

    if (items.length >= 24) {
      return splitIntoColumns(items, 3);
    }

    return splitIntoColumns(items, 2);
  }, [items]);

  return (
    <section
      className={[
        "bftp-service-area-card",
        hideLogos ? "bftp-service-area-card--plain" : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="bftp-service-area-card__header">
        <div className="bftp-service-area-card__identity">
          {!hideLogos ? (
            <div className="bftp-service-area-card__logos">
              <span className="bftp-service-area-card__crest">
                <Image
                  src={brandAssets.footerLogo.src}
                  alt={brandAssets.footerLogo.alt}
                  width={62}
                  height={62}
                  priority={false}
                />
              </span>
              <span className="bftp-service-area-card__authority">
                <Image
                  src={authorityLogo.src}
                  alt={authorityLogo.alt}
                  width={124}
                  height={52}
                  priority={false}
                />
              </span>
            </div>
          ) : null}
          <div className="bftp-service-area-card__copy">
            <span className="bftp-service-area-card__eyebrow">{directoryMeta.eyebrow}</span>
            <h3 className="bftp-service-area-card__title">{heading}</h3>
            <p className="bftp-service-area-card__summary">
              {getSummaryCopy(page, heading)}
            </p>
          </div>
        </div>
        <div className="bftp-service-area-card__meta">
          <span className="bftp-service-area-card__count">{directoryMeta.countLabel}</span>
          {!hideToggle ? (
            <button
              type="button"
              className="bftp-service-area-card__toggle"
              aria-expanded={expanded}
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? "Show fewer service areas" : "View all service areas"}
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={`bftp-service-area-card__body ${isExpanded ? "is-expanded" : ""}`}
      >
        <div className="bftp-service-area-card__columns">
          {columns.map((column, index) => (
            <ul key={`${heading}-${index}`} className="bftp-service-area-card__list">
              {column.map((item, itemIndex) => (
                <li
                  key={`${item.href}-${item.label}-${itemIndex}`}
                  className="bftp-service-area-card__item"
                >
                  {item.external ? (
                    <a
                      href={item.href}
                      target={item.target || "_blank"}
                      rel="noreferrer"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.href}>{item.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
        {!isExpanded ? <div className="bftp-service-area-card__fade" aria-hidden="true" /> : null}
      </div>
    </section>
  );
}
