"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, type KeyboardEvent, useMemo, useState } from "react";
import { usePostHog } from "posthog-js/react";

import type { ContentLinkItem, TabItem } from "@/lib/content/types";
import { siteConfig } from "@/lib/site-config";

type BodyBlock =
  | { kind: "paragraph"; content: string }
  | { kind: "list"; items: string[] };

function normalizeBody(body: string) {
  return body
    .replaceAll("‍", "\n")
    .replace(/\u200d/g, "\n")
    .replace(/([:.])\s+(?=-\s+)/g, "$1\n\n")
    .replace(/\s+(?=-\s+)/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLongParagraph(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 520) {
    return [normalized];
  }

  const sentences =
    normalized.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)?.map((sentence) => sentence.trim()) ??
    [normalized];
  const chunks: string[] = [];
  let chunk = "";

  for (const sentence of sentences) {
    if (chunk && `${chunk} ${sentence}`.length > 520) {
      chunks.push(chunk);
      chunk = sentence;
    } else {
      chunk = chunk ? `${chunk} ${sentence}` : sentence;
    }
  }

  if (chunk) {
    chunks.push(chunk);
  }

  return chunks;
}

function buildBodyBlocks(body: string): BodyBlock[] {
  return normalizeBody(body)
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length > 0 && lines.every((line) => line.startsWith("- "))) {
        return {
          kind: "list" as const,
          items: lines.map((line) => line.replace(/^-+\s*/, "").trim()).filter(Boolean),
        };
      }

      return {
        kind: "paragraph" as const,
        content: chunk.replace(/\s+/g, " ").trim(),
      };
    })
    .flatMap((block): BodyBlock[] => {
      if (block.kind === "paragraph") {
        return splitLongParagraph(block.content).map((content): BodyBlock => ({
          kind: "paragraph",
          content,
        }));
      }

      return [block];
    });
}

const tabPhotos: Array<[RegExp, string]> = [
  [/testing|annual/i, "/assets/services/device-test.avif"],
  [/repair/i, "/assets/services/device-repair.avif"],
  [/troubleshooting|inspection/i, "/assets/photos/dcda-test-cock-oc-2.jpg"],
  [/installation|device/i, "/assets/services/device-installation.avif"],
  [/security|lock|cage/i, "/assets/services/security-cage.avif"],
  [/water|authority|department|district|municipal|county/i, "/assets/photos/general-3.jpg"],
  [/compliance|regulation|requirement|certification|report|document/i, "/assets/photos/testing-oc.jpg"],
  [/fire|irrigation|pool|spa/i, "/assets/photos/general-4.jpg"],
  [/brands|preferred|trusted/i, "/assets/photos/chickfila-exterior.jpg"],
];

function getTabPhoto(tab: TabItem, overrides?: Record<string, string>) {
  const override = overrides?.[tab.label] ?? overrides?.[tab.title];

  if (override) {
    return override;
  }

  const fingerprint = `${tab.label} ${tab.title}`;

  return tabPhotos.find(([pattern]) => pattern.test(fingerprint))?.[1] ?? "/assets/photos/general-2.jpg";
}

function blockWeight(block: BodyBlock) {
  return block.kind === "paragraph"
    ? block.content.length
    : block.items.reduce((sum, item) => sum + item.length, 0);
}

function splitIntoColumns(blocks: BodyBlock[]) {
  const columns: BodyBlock[][] = [[], []];
  const weights = [0, 0];

  for (const block of blocks) {
    const columnIndex = weights[0] <= weights[1] ? 0 : 1;
    columns[columnIndex].push(block);
    weights[columnIndex] += blockWeight(block);
  }

  return columns;
}

function isWaterAuthorityTab(tab: TabItem) {
  const fingerprint = `${tab.label} ${tab.title}`.toLowerCase();

  return fingerprint.includes("water authority contact") || fingerprint.includes("water department");
}

export function TabRail({
  tabs,
  showPhotos = true,
  photoOverrides,
  titleMode = "title",
}: {
  tabs: TabItem[];
  showPhotos?: boolean;
  photoOverrides?: Record<string, string>;
  titleMode?: "title" | "label";
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const posthog = usePostHog();
  const activeTab = tabs[activeIndex];
  const activeTitle = titleMode === "label" ? activeTab?.label : activeTab?.title;

  const bodyBlocks = useMemo(
    () => (activeTab ? buildBodyBlocks(activeTab.body) : []),
    [activeTab],
  );
  const bodyColumns = useMemo(() => splitIntoColumns(bodyBlocks), [bodyBlocks]);
  const tabBaseId = useMemo(
    () =>
      `bftp-tabs-${tabs
        .map((tab) => tab.label)
        .join("-")
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase()}`,
    [tabs],
  );

  if (!activeTab) {
    return null;
  }

  const renderWaterAuthorityLinks = isWaterAuthorityTab(activeTab);
  const hasProvidedLinks = activeTab.links.length > 0;
  const useSeoLinkList = activeTab.links.length >= 4;
  const linkColumns = useSeoLinkList
    ? activeTab.links.length >= 18
      ? 3
      : activeTab.links.length >= 6
        ? 2
        : 1
    : activeTab.links.length >= 42
      ? 3
      : activeTab.links.length >= 18
        ? 2
        : 1;
  const defaultCta: ContentLinkItem = {
    href: siteConfig.contactPath,
    label: "Schedule Service",
    external: false,
    target: "",
  };
  const ctaLinks = hasProvidedLinks
    ? activeTab.links
    : renderWaterAuthorityLinks
      ? []
      : [defaultCta];
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const tabButtons = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    setActiveIndex(nextIndex);
    tabButtons[nextIndex]?.focus();
  };

  return (
    <div className="bftp-tab-panel">
      <aside className="bftp-tab-panel__rail-wrap">
        <div className="bftp-tab-panel__rail" role="tablist" aria-label="Compliance topics">
          {tabs.map((tab, index) => (
            <button
              key={`${tab.label}-${index}`}
              type="button"
              id={`${tabBaseId}-tab-${index}`}
              role="tab"
              aria-selected={index === activeIndex}
              aria-controls={`${tabBaseId}-panel`}
              tabIndex={index === activeIndex ? 0 : -1}
              className={
                index === activeIndex
                  ? "bftp-tab-panel__tab is-active"
                  : "bftp-tab-panel__tab"
              }
              onClick={() => {
                posthog?.capture("tab_selected", { tab_label: tab.label, tab_index: index });
                setActiveIndex(index);
              }}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <span className="bftp-tab-panel__tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </aside>
      <div
        id={`${tabBaseId}-panel`}
        className="bftp-tab-panel__body"
        role="tabpanel"
        aria-labelledby={`${tabBaseId}-tab-${activeIndex}`}
      >
        {showPhotos ? (
          <div className="bftp-tab-panel__media">
            <Image
              src={getTabPhoto(activeTab, photoOverrides)}
              alt=""
              fill
              sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 991px) calc(100vw - 40px), 54vw"
              className="bftp-tab-panel__image"
            />
          </div>
        ) : null}
        <h3 className="bftp-tab-panel__title">{activeTitle}</h3>
        <div className="bftp-tab-panel__content">
          <div className="bftp-tab-panel__text">
            {bodyColumns.map((column, columnIndex) => (
              <div
                key={`${activeTab.title}-column-${columnIndex}`}
                className="bftp-tab-panel__text-column"
              >
                {column.map((block, index) => (
                  <Fragment key={`${activeTab.title}-${columnIndex}-${index}`}>
                    {block.kind === "paragraph" ? (
                      <p className="bftp-tab-panel__paragraph">{block.content}</p>
                    ) : (
                      <ul className="bftp-tab-panel__list">
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </Fragment>
                ))}
              </div>
            ))}
          </div>
          {renderWaterAuthorityLinks && ctaLinks.length > 0 ? (
            <div className="bftp-tab-panel__authority-links">
              <span className="bftp-tab-panel__authority-label">Website:</span>
              {ctaLinks.map((link) =>
                link.external ? (
                  <a
                    key={`${activeTab.title}-${link.href}-${link.label}`}
                    href={link.href}
                    target={link.target || "_blank"}
                    rel="noreferrer"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link key={`${activeTab.title}-${link.href}-${link.label}`} href={link.href}>
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          ) : ctaLinks.length > 0 ? (
            <ul
              className={
                useSeoLinkList
                  ? "bftp-tab-panel__link-grid bftp-tab-panel__link-grid--seo"
                  : "bftp-tab-panel__link-grid"
              }
              style={{ ["--bftp-tab-link-columns" as string]: String(linkColumns) }}
            >
              {ctaLinks.map((link) => (
                <li
                  key={`${activeTab.title}-${link.href}-${link.label}`}
                  className="bftp-tab-panel__link-item"
                >
                  {link.external ? (
                    <a href={link.href} target={link.target || "_blank"} rel="noreferrer">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
