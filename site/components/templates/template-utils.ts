import { buildSectionBody } from "@/lib/templates/template-helpers";
import type { PageEntry } from "@/lib/site-schema";

export function findHeading(
  page: PageEntry,
  matcher: RegExp,
  fallback: string,
) {
  return page.headings.h2.find((heading) => matcher.test(heading)) ?? fallback;
}

export function buildHighlightItems(
  page: PageEntry,
  headings = page.headings.h2.slice(0, 3),
) {
  return headings.filter(Boolean).map((title) => ({
    title,
    body: buildSectionBody(page, title),
  }));
}

export function getBadgeItems(page: PageEntry, limit = 6) {
  const source = page.headings.h3.length > 0 ? page.headings.h3 : page.headings.h2;
  return source.slice(0, limit);
}
