import { cache } from "react";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import type { Metadata } from "next";

import type { AnyPagePayload } from "@/lib/content/types";
import {
  templateFamilies,
  type LinkItem,
  type PageEntry,
  type SiteCatalog,
  type TemplateFamily,
} from "@/lib/site-schema";

interface UrlInventoryRow {
  url: string;
  slug: string;
  path: string;
  depth: string;
  page_class: string;
  template_family: TemplateFamily;
  title: string;
  canonical: string;
}

interface HeadingRow {
  url: string;
  h1s?: string;
  h2s?: string;
  h3s?: string;
}

const SITE_ORIGIN = "https://www.backflowtestpros.com";
const FORENSICS_ROOT = path.resolve(process.cwd(), "data");
const HTML_ROOT = path.join(FORENSICS_ROOT, "raw", "html");

const countyLabels: Record<string, string> = {
  "la-county": "Los Angeles County",
  "orange-county": "Orange County",
  "riverside-county": "Riverside County",
  "san-bernardino-county": "San Bernardino County",
  "ventura-county": "Ventura County",
  "san-diego": "San Diego County",
  "san-diego-county": "San Diego County",
};

const countyHubPaths: Record<string, string> = {
  "la-county":
    "/los-angeles-county-backflow-testing-installation-repair-service-areas",
  "orange-county":
    "/orange-county-backflow-testing-installation-repair-service-areas",
  "riverside-county":
    "/riverside-county-backflow-testing-installation-repair-service-areas",
  "san-bernardino-county":
    "/san-bernardino-county-backflow-testing-installation-repair-service-areas",
  "ventura-county":
    "/ventura-county-backflow-testing-installation-repair-service-areas",
  "san-diego":
    "/san-diego-county-backflow-testing-installation-repair-service-areas",
  "san-diego-county":
    "/san-diego-county-backflow-testing-installation-repair-service-areas",
};

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ");
}

function splitHeadingField(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split("|")
    .map((item) =>
      decodeHtmlEntities(item.replaceAll("\u200d", "").replaceAll("‍", " ").trim()),
    )
    .filter(Boolean);
}

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const trimmed = pathname.trim().replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function pathToSourceStem(pathname: string) {
  if (pathname === "/") {
    return "home";
  }

  return pathname.replace(/^\//, "").replaceAll("/", "__");
}

function extractMetaTag(html: string, attribute: string, target: string) {
  const directPattern = new RegExp(
    `<meta[^>]+${attribute}="${target}"[^>]+content="([^"]*)"`,
    "i",
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content="([^"]*)"[^>]+${attribute}="${target}"`,
    "i",
  );

  return (
    directPattern.exec(html)?.[1] ??
    reversePattern.exec(html)?.[1] ??
    undefined
  );
}

function readHtmlMeta(pathname: string) {
  const sourceStem = pathToSourceStem(pathname);
  const sourceHtmlPath = path.join(HTML_ROOT, `${sourceStem}.html`);

  if (!existsSync(sourceHtmlPath)) {
    return { sourceStem, sourceHtmlPath };
  }

  const html = readFileSync(sourceHtmlPath, "utf8");

  return {
    sourceStem,
    sourceHtmlPath,
    description: decodeHtmlEntities(
      extractMetaTag(html, "name", "description") ?? "",
    ),
    ogImage: extractMetaTag(html, "property", "og:image"),
  };
}

function parseCsvFile<T>(filename: string) {
  const raw = readFileSync(path.join(FORENSICS_ROOT, filename), "utf8");

  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
  }) as T[];
}

function resolveCountySegment(
  templateFamily: TemplateFamily,
  segments: string[],
): string | undefined {
  if (templateFamily === "county_city_landing") {
    return segments[0];
  }

  if (
    templateFamily === "core_service" &&
    segments.length > 1 &&
    segments[0] === "san-diego"
  ) {
    return "san-diego";
  }

  if (
    templateFamily === "service_area_hub" &&
    segments[0]?.endsWith("-county-backflow-testing-installation-repair-service-areas")
  ) {
    return segments[0]
      .replace("-backflow-testing-installation-repair-service-areas", "")
      .replace("los-angeles-county", "la-county");
  }

  return undefined;
}

export const getSiteCatalog = cache((): SiteCatalog => {
  const inventoryRows = parseCsvFile<UrlInventoryRow>("url_inventory.csv");
  const headingRows = parseCsvFile<HeadingRow>("page_heading_map.csv");
  const headingByUrl = new Map(headingRows.map((row) => [row.url, row]));

  const pages = inventoryRows
    .map((row) => {
      const normalizedPath = normalizePath(row.path);
      const headingRow = headingByUrl.get(row.url);
      const htmlMeta = readHtmlMeta(normalizedPath);
      const segments = normalizedPath.split("/").filter(Boolean);
      const countySegment = resolveCountySegment(row.template_family, segments);

      const page: PageEntry = {
        url: row.url,
        slug: row.slug,
        path: normalizedPath,
        depth: Number(row.depth),
        pageClass: row.page_class,
        templateFamily: row.template_family,
        title: decodeHtmlEntities(row.title),
        canonical: row.canonical || `${SITE_ORIGIN}${normalizedPath}`,
        description:
          htmlMeta.description ||
          splitHeadingField(headingRow?.h3s)[0] ||
          splitHeadingField(headingRow?.h2s)[0] ||
          decodeHtmlEntities(row.title),
        ogImage: htmlMeta.ogImage,
        segments,
        countySegment,
        countyLabel: countySegment ? countyLabels[countySegment] : undefined,
        sourceStem: htmlMeta.sourceStem,
        sourceHtmlPath: htmlMeta.sourceHtmlPath,
        headings: {
          h1: splitHeadingField(headingRow?.h1s),
          h2: splitHeadingField(headingRow?.h2s),
          h3: splitHeadingField(headingRow?.h3s),
        },
      };

      return page;
    })
    .sort((left, right) => left.path.localeCompare(right.path));

  const byPath = new Map<string, PageEntry>();
  const byFamily = new Map<TemplateFamily, PageEntry[]>();

  for (const family of templateFamilies) {
    byFamily.set(family, []);
  }

  for (const page of pages) {
    byPath.set(page.path, page);
    byFamily.get(page.templateFamily)?.push(page);
  }

  return {
    pages,
    byPath,
    byFamily,
  };
});

export function getAllPages() {
  return getSiteCatalog().pages;
}

export function getPageByPath(pathname: string) {
  return getSiteCatalog().byPath.get(normalizePath(pathname));
}

export function getPagesByFamily(family: TemplateFamily) {
  return getSiteCatalog().byFamily.get(family) ?? [];
}

export function getCountyPages(countySegment: string) {
  return getAllPages().filter((page) => page.countySegment === countySegment);
}

export function getCountyHubPath(countySegment?: string) {
  return countySegment ? countyHubPaths[countySegment] : undefined;
}

export function resolvePathFromSlug(slug?: string[]) {
  if (!slug || slug.length === 0) {
    return "/";
  }

  return normalizePath(`/${slug.join("/")}`);
}

export function getStaticSlugParams() {
  return getAllPages()
    .filter((page) => page.path !== "/")
    .map((page) => ({
      slug: page.segments,
    }));
}

export function getPrimaryHeading(page: PageEntry) {
  return page.headings.h1[0] || decodeHtmlEntities(page.title);
}

export function getHeadingGroups(page: PageEntry) {
  return {
    h1: page.headings.h1,
    h2: page.headings.h2,
    h3: page.headings.h3,
  };
}

export function getRelatedPages(
  page: PageEntry,
  options: {
    family?: TemplateFamily;
    countySegment?: string;
    limit?: number;
  } = {},
) {
  const limit = options.limit ?? 6;
  let pool = getAllPages();

  if (options.family) {
    pool = getPagesByFamily(options.family);
  }

  if (options.countySegment) {
    pool = pool.filter((candidate) => candidate.countySegment === options.countySegment);
  }

  return pool.filter((candidate) => candidate.path !== page.path).slice(0, limit);
}

export function toLinkItems(pages: PageEntry[], limit = pages.length): LinkItem[] {
  return pages.slice(0, limit).map((page) => ({
    href: page.path,
    label: getPrimaryHeading(page),
    description: page.description,
  }));
}

export function buildPageMetadata(
  page: PageEntry,
  payload?: AnyPagePayload,
): Metadata {
  const resolvedTitle = payload?.title || page.title;
  const resolvedDescription = payload?.metaDescription || page.description;
  const resolvedCanonical = payload?.canonical || page.canonical;
  const resolvedImage = payload?.heroImage || page.ogImage;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: resolvedCanonical,
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: resolvedCanonical,
      siteName: "Backflow Test Pros",
      images: resolvedImage ? [{ url: resolvedImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: resolvedImage ? [resolvedImage] : undefined,
    },
  };
}
