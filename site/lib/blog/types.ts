import type { LinkItem } from "@/lib/site-schema";

export const blogStatuses = [
  "Queued",
  "Drafting",
  "Drafted",
  "Review Required",
  "Approved",
  "Scheduled",
  "Published",
  "Error",
] as const;

export type BlogStatus = (typeof blogStatuses)[number];

export const blogTemplateTypes = [
  "stat_explainer",
  "compliance_article",
  "cost_risk_article",
  "localized_service_article",
  "commercial_facility_article",
  "refresh_update_article",
] as const;

export type BlogTemplateType = (typeof blogTemplateTypes)[number];

export interface SourceStatReference {
  repositoryRow: number;
  dataPoint: string;
  value: string;
  scope: string;
  timePeriod: string;
  whyItMatters: string;
  sourceOrganization: string;
  sourceTitle: string;
  sourceUrl: string;
  authorityType: string;
  notes?: string | null;
}

export interface QueueRecord {
  id: string;
  articleTitle: string;
  category: string;
  sheetName: string;
  audience: string;
  geography: string;
  templateType: BlogTemplateType;
  primaryKeyword: string;
  secondaryKeywords: string[];
  sourceStats: SourceStatReference[];
  ctaType: string;
  slug: string;
  status: BlogStatus;
  notes: string;
}

export interface BlogFact {
  value: string;
  label: string;
  context: string;
}

export interface BlogFaqItem {
  question: string;
  answer: string;
}

export interface BlogSection {
  id: string;
  kind: "narrative" | "checklist" | "faq";
  title: string;
  body: string[];
  bullets?: string[];
  statCallout?: BlogFact | null;
  faqItems?: BlogFaqItem[];
}

export interface BlogReviewFlag {
  code: string;
  label: string;
  reason: string;
  severity: "info" | "warning" | "error";
}

export interface BlogCta {
  heading: string;
  body: string;
  label: string;
  href: string;
}

export interface BlogPost {
  slug: string;
  path: string;
  canonical: string;
  title: string;
  metaDescription: string;
  excerpt: string;
  category: string;
  audience: string;
  geography: string;
  templateType: BlogTemplateType;
  primaryKeyword: string;
  secondaryKeywords: string[];
  publishedAt: string | null;
  updatedAt: string;
  heroFact: BlogFact;
  keyTakeaways: string[];
  sections: BlogSection[];
  internalLinks: LinkItem[];
  cta: BlogCta;
  imageBrief: string;
  schemaTypes: string[];
  reviewFlags: BlogReviewFlag[];
  status: BlogStatus;
  sourceNotes: SourceStatReference[];
}

export type PublicBlogPost = Omit<BlogPost, "sourceNotes">;

export interface BlogIndexEntry {
  slug: string;
  path: string;
  canonical: string;
  title: string;
  excerpt: string;
  category: string;
  audience: string;
  geography: string;
  templateType: BlogTemplateType;
  primaryKeyword: string;
  heroFact: BlogFact;
  publishedAt: string;
  updatedAt: string;
  status: Extract<BlogStatus, "Published">;
}
