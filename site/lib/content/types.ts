export type PageFamily =
  | "homepage"
  | "about_page"
  | "contact_page"
  | "core_service"
  | "county_city_landing"
  | "service_area_hub"
  | "commercial_vertical"
  | "county_service_hub"
  | "regulation_page"
  | "legal_page";

export type SectionKind =
  | "hero"
  | "logo_strip"
  | "feature_cards"
  | "pricing_tiles"
  | "cta_banner"
  | "tabbed_content"
  | "bullet_columns"
  | "link_list"
  | "faq_accordion"
  | "rich_text"
  | "form_section";

export interface ContentLinkItem {
  label: string;
  href: string;
  description?: string;
  external: boolean;
  target: string;
}

export interface ContentImage {
  src: string;
  alt: string;
}

export interface ContentCard {
  title: string;
  body: string;
  icon: ContentImage | null;
}

export interface PricingTile {
  price: string;
  title: string;
  detail: string;
}

export interface TabItem {
  label: string;
  title: string;
  body: string;
  links: ContentLinkItem[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ContactFormField {
  label: string;
  name: string;
  fieldType: string;
  inputType: string;
  placeholder: string;
  required: boolean;
  options: string[];
}

export interface MapEmbedData {
  title: string;
  latitude: number | null;
  longitude: number | null;
  zoom: string;
  tooltip: string;
}

export interface HeroSection {
  kind: "hero";
  sourceClass: string;
  heading: string;
  body: string;
  primaryCta: ContentLinkItem | null;
  phoneCta: ContentLinkItem | null;
}

export interface LogoStripSection {
  kind: "logo_strip";
  sourceClass: string;
  heading: string;
  logos: ContentImage[];
}

export interface FeatureCardsSection {
  kind: "feature_cards";
  sourceClass: string;
  heading: string;
  body: string;
  cards: ContentCard[];
  links?: ContentLinkItem[];
}

export interface PricingTilesSection {
  kind: "pricing_tiles";
  sourceClass: string;
  heading: string;
  body: string;
  tiles: PricingTile[];
  links: ContentLinkItem[];
}

export interface CtaBannerSection {
  kind: "cta_banner";
  sourceClass: string;
  heading: string;
  body: string;
  links: ContentLinkItem[];
}

export interface TabbedContentSection {
  kind: "tabbed_content";
  sourceClass: string;
  heading: string;
  body: string;
  tabs: TabItem[];
}

export interface BulletColumnsSection {
  kind: "bullet_columns";
  sourceClass: string;
  heading: string;
  body: string;
  columns: string[][];
}

export interface LinkListSection {
  kind: "link_list";
  sourceClass: string;
  heading: string;
  body: string;
  items: ContentLinkItem[];
  map: MapEmbedData | null;
}

export interface FaqAccordionSection {
  kind: "faq_accordion";
  sourceClass: string;
  heading: string;
  items: FaqItem[];
}

export interface RichTextSection {
  kind: "rich_text";
  sourceClass: string;
  heading: string;
  body: string;
  links: ContentLinkItem[];
}

export interface FormSection {
  kind: "form_section";
  sourceClass: string;
  heading: string;
  body: string;
  submitLabel: string;
  formAction: string;
  formMethod: string;
  fields: ContactFormField[];
}

export type ContentSection =
  | HeroSection
  | LogoStripSection
  | FeatureCardsSection
  | PricingTilesSection
  | CtaBannerSection
  | TabbedContentSection
  | BulletColumnsSection
  | LinkListSection
  | FaqAccordionSection
  | RichTextSection
  | FormSection;

export interface ContentAnomalyRecord {
  code: string;
  severity: string;
  detail: string;
}

export interface BasePagePayload {
  slug: string;
  path: string;
  url: string;
  family: PageFamily;
  sourceTemplateFamily: string;
  pageClass: string;
  title: string;
  metaDescription: string;
  canonical: string;
  h1: string;
  h2s: string[];
  h3s: string[];
  schemaTypes: string[];
  wordCount: number;
  primaryKeywordIntent: string;
  ctaPattern: string[];
  heroImage: string;
  hero: HeroSection | null;
  brandLogos: ContentImage[];
  sections: ContentSection[];
  sectionKinds: SectionKind[];
  anomalyFlags: string[];
  anomalyRecords: ContentAnomalyRecord[];
}

export interface HomePagePayload extends BasePagePayload {
  family: "homepage";
  pricingTiles: PricingTile[];
  serviceAreaItems: ContentLinkItem[];
}

export interface AboutPagePayload extends BasePagePayload {
  family: "about_page";
  featureCards: ContentCard[];
  tabGroups: TabItem[][];
}

export interface ContactPagePayload extends BasePagePayload {
  family: "contact_page";
  contactForm: FormSection | null;
}

export interface CoreServicePage extends BasePagePayload {
  family: "core_service";
  serviceKind: string;
  pricingTiles: PricingTile[];
  faqItems: FaqItem[];
  tabGroups: TabItem[][];
  serviceAreaItems: ContentLinkItem[];
}

export interface CountyCityLandingPage extends BasePagePayload {
  family: "county_city_landing";
  countySlug: string;
  countyName: string;
  citySlug: string;
  cityName: string;
  serviceVariant: string;
  pricingTiles: PricingTile[];
  maintenanceColumns: string[][];
  neighborhoodItems: ContentLinkItem[];
  serviceAreaMap: MapEmbedData | null;
  regulationTabs: TabItem[];
}

export interface ServiceAreaHubPage extends BasePagePayload {
  family: "service_area_hub";
  countySlug: string;
  countyName: string;
  hubScope: string;
  quickLinks: ContentLinkItem[];
  cityLinks: ContentLinkItem[];
}

export interface CommercialVerticalPage extends BasePagePayload {
  family: "commercial_vertical";
  industrySlug: string;
  featureCards: ContentCard[];
  pricingTiles: PricingTile[];
  reviewLinks: ContentLinkItem[];
}

export interface CountyServiceHubPage extends BasePagePayload {
  family: "county_service_hub";
  countySlug: string;
  countyName: string;
  featureCards: ContentCard[];
  pricingTiles: PricingTile[];
  serviceAreaItems: ContentLinkItem[];
}

export interface RegulationPagePayload extends BasePagePayload {
  family: "regulation_page";
  countySlug: string;
  countyName: string;
  authorityTabs: TabItem[];
  regulationTabs: TabItem[];
  resourceMap: MapEmbedData | null;
}

export interface LegalPagePayload extends BasePagePayload {
  family: "legal_page";
  legalBody: string;
}

export type AnyPagePayload =
  | HomePagePayload
  | AboutPagePayload
  | ContactPagePayload
  | CoreServicePage
  | CountyCityLandingPage
  | ServiceAreaHubPage
  | CommercialVerticalPage
  | CountyServiceHubPage
  | RegulationPagePayload
  | LegalPagePayload;

export interface ArchivedPageDecision {
  slug: string;
  url: string;
  title: string;
  roleGuess: string;
  latestWaybackUrl: string;
  likelyLiveReplacement: string;
  roundOneDecision: string;
  redirectTarget: string;
  reason: string;
}

export interface GeneratedPageIndex {
  generatedAt: string;
  familyCounts: Record<string, number>;
  modeledPageCount: number;
  omittedLivePageCount: number;
  sourceFamilyMismatchCount: number;
  topAnomalyCodes: Array<[string, number]>;
  pages: Array<{
    slug: string;
    path: string;
    family: PageFamily;
    title: string;
    countySlug: string;
    citySlug: string;
  }>;
  omittedLivePages: Array<{
    slug: string;
    path: string;
    sourceTemplateFamily: string;
    pageClass: string;
  }>;
}

export interface GeneratedPageLookup {
  generatedAt: string;
  modeledPageCount: number;
  pagesByPath: Record<string, AnyPagePayload>;
}

export interface ContentAnomalyEntry {
  slug: string;
  path: string;
  family: string;
  severity: string;
  code: string;
  detail: string;
}
