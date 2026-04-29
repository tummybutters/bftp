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
    {
      label: "Licensed CA Contractor",
      matches: ["CA Contractor License", "CA State Licensed Contractor", "Licensed CA Contractor"],
    },
    {
      label: "Multi-Device Discounts",
      matches: ["Multi-Device Discount", "Multi-Device Discounts"],
    },
    {
      label: "AWWA Certified Testers",
      matches: ["AWWA Backflow Certified", "AWWA Certified", "Backflow Certified"],
    },
    {
      label: "Bonded & Insured",
      matches: ["Bonded & Insured for over $2,000,000", "BondedInsured", "Bonded & Insured"],
    },
    {
      label: "Repair Coverage Available",
      matches: ["Free Repair Coverage", "Repair Coverage", "Repair Coverage Available"],
    },
    {
      label: "Same-Day Report Submittal",
      matches: ["Same Day Certification", "Same-Day Certification", "Same-Day Report Submittal"],
    },
    {
      label: "Southern California Service",
      matches: ["Serving All of Southern California", "Southern California Service"],
    },
    {
      label: "Priority Scheduling",
      matches: ["Priority Booking", "Priority Scheduling"],
    },
    {
      label: "Emergency Service",
      matches: ["Emergency Service"],
    },
  ];
  const safeFillers = [
    "Local Authority Coordination",
    "Compliance Scheduling Support",
    "Report Submittal Support",
  ];

  const normalized = body.toLowerCase().replace(/[^a-z0-9]/g, "");
  const proofItems = candidates
    .filter((candidate) =>
      candidate.matches.some((match) =>
        normalized.includes(match.toLowerCase().replace(/[^a-z0-9]/g, "")),
      ),
    )
    .map((candidate) => candidate.label);

  if (proofItems.length > 0 && proofItems.length < 9) {
    proofItems.push(...safeFillers.slice(0, 9 - proofItems.length));
  }

  return proofItems;
}

export function toLinkItemsFromContent(items: ContentLinkItem[]): LinkItem[] {
  return items.map((item) => ({
    href: item.href,
    label: item.label,
    description: item.description,
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
