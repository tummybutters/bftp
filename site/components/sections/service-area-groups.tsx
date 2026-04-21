"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { authorityLogos, brandAssets } from "@/lib/design";
import type { PageEntry } from "@/lib/site-schema";

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
    };
  }

  if (/service area|services near you|service directory/.test(lowerHeading)) {
    return {
      eyebrow: "Service Directory",
      countLabel: `${count} cities`,
    };
  }

  return {
    eyebrow: "Directory",
    countLabel: `${count} entries`,
  };
}

function getSummaryCopy(page: PageEntry, heading: string, count: number) {
  const countyName = page.countyLabel ?? heading.replace(/\s+installation service areas/i, "").trim();
  const lowerHeading = heading.toLowerCase();

  if (/requirement|resource|regulation|district/.test(lowerHeading)) {
    return `Municipal requirement references collected for ${countyName} with ${count} preserved directory entries.`;
  }

  return `Certified backflow installation coverage across ${countyName} with ${count} preserved service-area references.`;
}

function splitIntoColumns<T>(items: T[], columnCount: number) {
  const size = Math.ceil(items.length / columnCount);
  return Array.from({ length: columnCount }, (_, index) =>
    items.slice(index * size, index * size + size),
  ).filter((column) => column.length > 0);
}

export function ServiceAreaGroups({
  page,
  groups,
}: {
  page: PageEntry;
  groups: Array<{
    heading: string;
    items: Array<{
      label: string;
      href?: string;
    }>;
  }>;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  return (
    <div className="bftp-service-area-groups">
      {groups.map((group) => {
        const expanded = Boolean(expandedGroups[group.heading]);
        const authorityLogo = getAuthorityLogo(page, group.heading);
        const directoryMeta = getDirectoryMeta(group.heading, group.items.length);
        const columns = splitIntoColumns(
          group.items,
          group.items.length >= 54 ? 4 : group.items.length >= 24 ? 3 : 2,
        );

        return (
          <section key={group.heading} className="bftp-service-area-card">
            <div className="bftp-service-area-card__header">
              <div className="bftp-service-area-card__identity">
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
                <div className="bftp-service-area-card__copy">
                  <span className="bftp-service-area-card__eyebrow">{directoryMeta.eyebrow}</span>
                  <h3 className="bftp-service-area-card__title">{group.heading}</h3>
                  <p className="bftp-service-area-card__summary">
                    {getSummaryCopy(page, group.heading, group.items.length)}
                  </p>
                </div>
              </div>
              <div className="bftp-service-area-card__meta">
                <span className="bftp-service-area-card__count">{directoryMeta.countLabel}</span>
                <button
                  type="button"
                  className="bftp-service-area-card__toggle"
                  aria-expanded={expanded}
                  onClick={() =>
                    setExpandedGroups((current) => ({
                      ...current,
                      [group.heading]: !current[group.heading],
                    }))
                  }
                >
                  {expanded ? "Show fewer service areas" : "View all service areas"}
                </button>
              </div>
            </div>

            <div
              className={`bftp-service-area-card__body ${expanded ? "is-expanded" : ""}`}
            >
              <div className="bftp-service-area-card__columns">
                {columns.map((column, index) => (
                  <ul key={`${group.heading}-${index}`} className="bftp-service-area-card__list">
                    {column.map((item) => (
                      <li key={item.label} className="bftp-service-area-card__item">
                        {item.href ? (
                          <Link href={item.href} className="bftp-service-area-card__text-link">
                            {item.label}
                          </Link>
                        ) : (
                          <span className="bftp-service-area-card__text">{item.label}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
              {!expanded ? (
                <div className="bftp-service-area-card__fade" aria-hidden="true" />
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
