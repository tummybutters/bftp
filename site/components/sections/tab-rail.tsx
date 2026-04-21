"use client";

import Link from "next/link";
import { useState } from "react";
import { usePostHog } from "posthog-js/react";

import type { TabItem } from "@/lib/content/types";

function normalizeBody(body: string) {
  return body.replaceAll("‍", "\n").split(/\n+/).map((part) => part.trim()).filter(Boolean);
}

function splitSentences(paragraphs: string[]) {
  return paragraphs
    .flatMap((paragraph) =>
      paragraph
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean),
    );
}

function buildKeyPoints(paragraphs: string[]) {
  const sentencePool = splitSentences(paragraphs);
  const preferred = sentencePool.filter((sentence) =>
    /(must|required|ensure|install|installed|testing|tested|accessible|maintain|inspection|permit|protect)/i.test(
      sentence,
    ),
  );

  return (preferred.length ? preferred : sentencePool)
    .filter((sentence) => sentence.length >= 48 && sentence.length <= 220)
    .slice(0, 4);
}

function formatCtaLabel(label?: string) {
  if (!label) {
    return "Call Now";
  }

  const normalized = label
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (normalized === "call now") {
    return "Call Now";
  }

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function TabRail({
  tabs,
  ctaLabel,
  ctaHref = "/contact-backflowtestpros",
}: {
  tabs: TabItem[];
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const posthog = usePostHog();
  const activeTab = tabs[activeIndex];

  if (!activeTab) {
    return null;
  }

  const paragraphs = normalizeBody(activeTab.body);
  const summaryParagraphs =
    paragraphs.length > 1 ? paragraphs.slice(0, 2) : paragraphs.slice(0, 1);
  const detailParagraphs =
    paragraphs.length > 2 ? paragraphs.slice(2) : paragraphs.slice(summaryParagraphs.length);
  const keyPoints = buildKeyPoints(paragraphs);

  return (
    <div className="bftp-tab-panel">
      <aside className="bftp-tab-panel__rail-wrap">
        <div className="bftp-tab-panel__rail-kicker">Installation Guide</div>
        <div className="bftp-tab-panel__rail" role="tablist" aria-label="Compliance topics">
          {tabs.map((tab, index) => (
            <button
              key={`${tab.label}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              className={
                index === activeIndex
                  ? "bftp-tab-panel__tab is-active"
                  : "bftp-tab-panel__tab"
              }
              onClick={() => {
                posthog?.capture("tab_selected", { tab_label: tab.label, tab_index: index });
                setActiveIndex(index);
              }}
            >
              <span className="bftp-tab-panel__tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </aside>
      <div className="bftp-tab-panel__body">
        <div className="bftp-tab-panel__intro">
          <div className="bftp-tab-panel__eyebrow">Selected Topic</div>
          <h3 className="bftp-tab-panel__title">{activeTab.title}</h3>
          <div className="bftp-tab-panel__summary">
            {summaryParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        {keyPoints.length > 0 ? (
          <section className="bftp-tab-panel__summary-card">
            <div className="bftp-tab-panel__summary-kicker">What Matters Most</div>
            <h4 className="bftp-tab-panel__summary-title">Key installation requirements</h4>
            <ul className="bftp-tab-panel__summary-list">
              {keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {detailParagraphs.length > 0 ? (
          <div className="bftp-tab-panel__detail">
            {detailParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}
        {activeTab.links.length > 0 ? (
          <div className="bftp-tab-panel__references">
            <div className="bftp-tab-panel__summary-kicker">Reference Links</div>
            <ul className="bftp-tab-panel__links">
              {activeTab.links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <a href={link.href} target={link.target || "_blank"} rel="noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {ctaLabel ? (
          <div className="bftp-tab-panel__cta-card">
            <div className="bftp-tab-panel__summary-kicker">Next Step</div>
            <h4 className="bftp-tab-panel__cta-title">Talk with a certified backflow specialist</h4>
            <p className="bftp-tab-panel__cta-copy">
              Get installation guidance, testing support, and local compliance help without
              digging through municipal requirements alone.
            </p>
            <div className="bftp-tab-panel__actions">
              <Link href={ctaHref} className="bftp-cta-button" onClick={() => posthog?.capture("contact_cta_clicked", { location: "tab-rail", label: formatCtaLabel(ctaLabel) })}>
                {formatCtaLabel(ctaLabel)}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
