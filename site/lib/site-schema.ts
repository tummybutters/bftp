import type { AnyPagePayload } from "@/lib/content/types";

export const templateFamilies = [
  "homepage",
  "core_service",
  "county_city_landing",
  "service_area_hub",
  "commercial_vertical",
  "regulation_page",
  "about_page",
  "contact_page",
  "county_service_hub",
  "legal_page",
] as const;

export type TemplateFamily = (typeof templateFamilies)[number];

export interface LinkItem {
  href: string;
  label: string;
  description?: string;
  external?: boolean;
  target?: string;
}

export interface PageEntry {
  url: string;
  slug: string;
  path: string;
  depth: number;
  pageClass: string;
  templateFamily: TemplateFamily;
  title: string;
  canonical: string;
  description: string;
  ogImage?: string;
  segments: string[];
  countySegment?: string;
  countyLabel?: string;
  sourceStem: string;
  sourceHtmlPath: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
}

export interface SiteCatalog {
  pages: PageEntry[];
  byPath: Map<string, PageEntry>;
  byFamily: Map<TemplateFamily, PageEntry[]>;
}

export interface TemplateSection {
  id: string;
  title: string;
  eyebrow: string;
  body: string;
  points?: string[];
  links?: LinkItem[];
}

export interface PageTemplateProps {
  page: PageEntry;
  catalog: SiteCatalog;
  sectionOrder: string[];
  templateLabel: string;
  payload?: AnyPagePayload;
}
