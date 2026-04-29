import { TrackedSection } from "@/lib/analytics/tracked-section";
import { ContentSectionRenderer } from "@/components/sections/content-section-renderer";
import {
  getInTheFieldStripInsertIndex,
  InTheFieldStrip,
  shouldRenderInTheFieldStrip,
} from "@/components/sections/in-the-field-strip";
import { PageHero } from "@/components/sections/page-hero";
import type { ContentSection, PageFamily } from "@/lib/content/types";
import { getPrimaryHeading } from "@/lib/content/site-index";
import type { PageTemplateProps } from "@/lib/site-schema";

type OrderedSection = {
  section: ContentSection;
  originalIndex: number;
};

const pagesWithoutBottomServiceAreaRepeats = new Set([
  "/",
  "/backflow-testing",
  "/backflow-repair-replacement-services",
  "/backflow-installation",
]);

function shouldHideSection(pagePath: string, section: ContentSection) {
  const fingerprint = `${section.sourceClass} ${
    "heading" in section ? section.heading : ""
  }`.toLowerCase();

  if (
    section.kind === "link_list" &&
    pagesWithoutBottomServiceAreaRepeats.has(pagePath) &&
    fingerprint.includes("service-areas")
  ) {
    return true;
  }

  if (
    pagePath === "/about-us" &&
    (section.kind === "feature_cards" || section.kind === "rich_text") &&
    (fingerprint.includes("testimonial") ||
      fingerprint.includes("trusted by residential"))
  ) {
    return true;
  }

  return false;
}

function isAboutRecognitionSection(section: ContentSection) {
  return (
    section.kind === "rich_text" &&
    `${section.sourceClass} ${section.heading}`
      .toLowerCase()
      .includes("recognized by national")
  );
}

function orderAboutSections(sections: ContentSection[]): OrderedSection[] {
  const indexed = sections.map((section, originalIndex) => ({ section, originalIndex }));
  const recognition = indexed.find(({ section }) => isAboutRecognitionSection(section));

  if (!recognition) {
    return indexed;
  }

  const withoutRecognition = indexed.filter((entry) => entry !== recognition);
  const ctaIndex = withoutRecognition.findIndex(({ section }) => section.kind === "cta_banner");

  if (ctaIndex < 0) {
    return [...withoutRecognition, recognition];
  }

  return [
    ...withoutRecognition.slice(0, ctaIndex),
    recognition,
    ...withoutRecognition.slice(ctaIndex),
  ];
}

function orderServiceAreaSections(
  pagePath: string,
  sections: ContentSection[],
): OrderedSection[] {
  const indexed = sections.map((section, originalIndex) => ({ section, originalIndex }));
  const isRootHub = pagePath === "/backflow-testing-installation-repair-service-areas";
  const allowedKinds = isRootHub
    ? ["link_list", "logo_strip", "rich_text"]
    : ["bullet_columns", "logo_strip", "cta_banner"];

  return allowedKinds.flatMap((kind) =>
    indexed.filter(({ section }) => section.kind === kind),
  );
}

function getOrderedSections(
  pagePath: string,
  family: PageFamily,
  sections: ContentSection[],
): OrderedSection[] {
  if (family === "service_area_hub") {
    return orderServiceAreaSections(pagePath, sections);
  }

  if (pagePath === "/about-us") {
    return orderAboutSections(sections);
  }

  return sections.map((section, originalIndex) => ({ section, originalIndex }));
}

export function StructuredPageTemplate({
  page,
  payload,
}: PageTemplateProps) {
  const family = (payload?.family ?? page.templateFamily) as PageFamily;

  if (!payload) {
    return (
      <PageHero
        eyebrow=""
        title={getPrimaryHeading(page)}
        subtitle={page.description}
        bodyLines={[page.description]}
        heroVariant="navy"
      />
    );
  }

  const kindCounts = new Map<string, number>();
  const shouldRenderFieldStrip = shouldRenderInTheFieldStrip(page.path);
  const fieldStripInsertIndex = shouldRenderFieldStrip
    ? getInTheFieldStripInsertIndex(page.path, payload.sections)
    : -1;
  const orderedSections = getOrderedSections(page.path, family, payload.sections);

  return (
    <>
      {orderedSections.map(({ section, originalIndex }, renderIndex) => {
        const kindIndex = kindCounts.get(section.kind) ?? 0;
        kindCounts.set(section.kind, kindIndex + 1);
        const shouldInjectFieldStrip =
          shouldRenderFieldStrip && originalIndex === fieldStripInsertIndex;

        return (
          <TrackedSection
            key={`${page.path}-${section.kind}-${originalIndex}`}
            sectionType={section.kind}
            sectionIndex={renderIndex}
          >
            {shouldHideSection(page.path, section) ? null : (
              <>
                <ContentSectionRenderer
                  page={page}
                  payload={payload}
                  section={section}
                  family={family}
                  overallIndex={renderIndex}
                  kindIndex={kindIndex}
                />
                {shouldInjectFieldStrip ? <InTheFieldStrip path={page.path} /> : null}
              </>
            )}
          </TrackedSection>
        );
      })}
    </>
  );
}
