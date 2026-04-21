import {
  getCountyHubPath,
  getPrimaryHeading,
  getRelatedPages,
  toLinkItems,
} from "@/lib/content/site-index";
import type { LinkItem, PageEntry } from "@/lib/site-schema";

export function buildQuickLinks(
  sectionOrder: string[],
  labelMap: Partial<Record<string, string>>,
) {
  return sectionOrder.map((sectionId) => ({
    href: `#${sectionId}`,
    label: labelMap[sectionId] ?? humanizeKey(sectionId),
  }));
}

export function humanizeKey(value: string) {
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getContextLabel(page: PageEntry) {
  if (page.templateFamily === "homepage") {
    return "Southern California";
  }

  const heading = getPrimaryHeading(page);
  return heading
    .replace(/\s+Backflow.*$/i, "")
    .replace(/\s+Services$/i, "")
    .replace(/\s+Frequently Asked Questions$/i, "");
}

export function buildSectionBody(page: PageEntry, sectionTitle: string) {
  const context = getContextLabel(page);

  switch (page.templateFamily) {
    case "homepage":
      return `${context} routing now runs through a reusable section system so service, county, and industry pages can inherit the same trust, pricing, and service-area patterns without rebuilding each page by hand.`;
    case "core_service":
      return `${sectionTitle} for ${context.toLowerCase()} is wired to a shared service template that can absorb exact city coverage, compliance copy, and offer language from Agent 2 without structural rework.`;
    case "county_city_landing":
      return `${sectionTitle} for ${context} is rendered from the same city-page shell used across the county rollout, keeping pricing, liability, regulation, and nearby-city modules consistent.`;
    case "service_area_hub":
      return `${sectionTitle} is driven by the service-area hub template, giving county hubs and the master service-area page the same list rendering pipeline and promotion surfaces.`;
    case "commercial_vertical":
      return `${sectionTitle} for ${context.toLowerCase()} is connected to the shared industry template so specialization pages can swap exact compliance details later without changing layout logic.`;
    default:
      return `${sectionTitle} is available through the shared render pipeline and can be enriched with exact content in the next round.`;
  }
}

export function buildFamilyLinkItems(page: PageEntry): LinkItem[] {
  switch (page.templateFamily) {
    case "core_service":
      return toLinkItems(getRelatedPages(page, { family: "core_service", limit: 6 }));
    case "county_city_landing":
      return toLinkItems(
        getRelatedPages(page, {
          countySegment: page.countySegment,
          limit: 8,
        }),
      );
    case "service_area_hub":
      if (page.countySegment) {
        return toLinkItems(
          getRelatedPages(page, {
            countySegment: page.countySegment,
            limit: 12,
          }),
        );
      }

      return toLinkItems(getRelatedPages(page, { family: "service_area_hub", limit: 6 }));
    case "commercial_vertical":
      return toLinkItems(
        getRelatedPages(page, { family: "commercial_vertical", limit: 8 }),
      );
    default:
      return toLinkItems(getRelatedPages(page, { limit: 6 }));
  }
}

export function buildCountyHubLink(page: PageEntry): LinkItem | undefined {
  const hubPath = getCountyHubPath(page.countySegment);

  if (!hubPath) {
    return undefined;
  }

  return {
    href: hubPath,
    label: `${page.countyLabel ?? "County"} service area hub`,
    description: "Browse every captured city page and county-wide service area link.",
  };
}
