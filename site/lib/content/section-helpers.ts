import type {
  AnyPagePayload,
  BulletColumnsSection,
  ContentImage,
  ContentLinkItem,
  ContentSection,
  CtaBannerSection,
  FeatureCardsSection,
  HeroSection,
  LinkListSection,
  LogoStripSection,
  PricingTilesSection,
  RichTextSection,
  TabbedContentSection,
} from "@/lib/content/types";
import type { LinkItem } from "@/lib/site-schema";

type SectionKind = ContentSection["kind"];

export function getSectionByKind<TKind extends SectionKind>(
  payload: AnyPagePayload | undefined,
  kind: TKind,
  index = 0,
): Extract<ContentSection, { kind: TKind }> | undefined {
  const sections = getSectionsByKind(payload, kind);
  return sections[index];
}

export function getSectionsByKind<TKind extends SectionKind>(
  payload: AnyPagePayload | undefined,
  kind: TKind,
): Array<Extract<ContentSection, { kind: TKind }>> {
  if (!payload) {
    return [];
  }

  return payload.sections.filter(
    (section): section is Extract<ContentSection, { kind: TKind }> =>
      section.kind === kind,
  );
}

export function normalizeContentBody(body: string) {
  return body.replaceAll("‍", "\n").replaceAll("\u200d", "\n").trim();
}

export function splitContentBody(body: string) {
  return normalizeContentBody(body)
    .split(/\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function extractProofItems(body: string) {
  const candidates = [
    "CA Contractor License",
    "Multi-Device Discount",
    "AWWA Backflow Certified",
    "Bonded & Insured for over $2,000,000",
    "Free Repair Coverage",
    "Same Day Certification",
    "Serving All of Southern California",
  ];

  const normalized = body.toLowerCase().replace(/[^a-z0-9]/g, "");

  return candidates.filter((candidate) =>
    normalized.includes(candidate.toLowerCase().replace(/[^a-z0-9]/g, "")),
  );
}

export function toLinkItemsFromContent(items: ContentLinkItem[]): LinkItem[] {
  return items.map((item) => ({
    href: item.href,
    label: item.label,
    external: item.external,
    target: item.target,
  }));
}

export function pickHeroSection(payload: AnyPagePayload | undefined) {
  return getSectionByKind(payload, "hero") as HeroSection | undefined;
}

export function pickLogoStrip(payload: AnyPagePayload | undefined) {
  return getSectionByKind(payload, "logo_strip") as LogoStripSection | undefined;
}

export function pickFeatureSection(payload: AnyPagePayload | undefined) {
  return getSectionByKind(payload, "feature_cards") as
    | FeatureCardsSection
    | undefined;
}

export function pickPricingSection(payload: AnyPagePayload | undefined) {
  return getSectionByKind(payload, "pricing_tiles") as
    | PricingTilesSection
    | undefined;
}

export function pickBannerSection(payload: AnyPagePayload | undefined) {
  return getSectionByKind(payload, "cta_banner") as CtaBannerSection | undefined;
}

export function pickLinkSection(
  payload: AnyPagePayload | undefined,
  index = 0,
) {
  return getSectionByKind(payload, "link_list", index) as
    | LinkListSection
    | undefined;
}

export function pickRichTextSection(
  payload: AnyPagePayload | undefined,
  index = 0,
) {
  return getSectionByKind(payload, "rich_text", index) as
    | RichTextSection
    | undefined;
}

export function pickTabbedSection(
  payload: AnyPagePayload | undefined,
  index = 0,
) {
  return getSectionByKind(payload, "tabbed_content", index) as
    | TabbedContentSection
    | undefined;
}

export function pickBulletColumns(
  payload: AnyPagePayload | undefined,
  index = 0,
) {
  return getSectionByKind(payload, "bullet_columns", index) as
    | BulletColumnsSection
    | undefined;
}

export function pickLocalLogoSet(
  fallback: ContentImage[] | undefined,
  logoCount = 6,
) {
  return fallback?.slice(0, logoCount);
}
