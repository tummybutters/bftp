import { TrackedSection } from "@/lib/analytics/tracked-section";
import { ContentSectionRenderer } from "@/components/sections/content-section-renderer";
import {
  getInTheFieldStripInsertIndex,
  InTheFieldStrip,
  shouldRenderInTheFieldStrip,
} from "@/components/sections/in-the-field-strip";
import { ScrollVideo } from "@/components/sections/scroll-video";
import { PageHero } from "@/components/sections/page-hero";
import type { PageFamily } from "@/lib/content/types";
import { getPrimaryHeading } from "@/lib/content/site-index";
import type { PageTemplateProps } from "@/lib/site-schema";

/** Insert the scroll-driven video after the credential carousel on the homepage */
function isCredentialSection(section: { sourceClass?: string }) {
  return (section.sourceClass ?? "")
    .toLowerCase()
    .includes("certifiedby-city-water-departments");
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

  return (
    <>
      {payload.sections.map((section, overallIndex) => {
        const kindIndex = kindCounts.get(section.kind) ?? 0;
        kindCounts.set(section.kind, kindIndex + 1);
        const shouldInjectFieldStrip =
          shouldRenderFieldStrip && overallIndex === fieldStripInsertIndex;

        return (
          <TrackedSection
            key={`${page.path}-${section.kind}-${overallIndex}`}
            sectionType={section.kind}
            sectionIndex={overallIndex}
          >
            <ContentSectionRenderer
              page={page}
              payload={payload}
              section={section}
              family={family}
              overallIndex={overallIndex}
              kindIndex={kindIndex}
            />
            {shouldInjectFieldStrip ? <InTheFieldStrip path={page.path} /> : null}
            {family === "homepage" && isCredentialSection(section) ? (
              <ScrollVideo src="/assets/videos/backflow-blowout.mp4" />
            ) : null}
          </TrackedSection>
        );
      })}
    </>
  );
}
