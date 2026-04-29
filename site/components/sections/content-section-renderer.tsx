import Image from "next/image";

import { ContactFormSection } from "@/components/sections/contact-form";
import { ClientReviewCarousel } from "@/components/sections/client-review-carousel";
import { FeatureSplit } from "@/components/sections/feature-split";
import { BenefitShowcase } from "@/components/sections/benefit-showcase";
import { ProofMarquee } from "@/components/sections/proof-marquee";
import { ServiceTriad } from "@/components/sections/service-triad";
import { SplitChecklist } from "@/components/sections/split-checklist";
import { CtaBanner } from "@/components/sections/cta-banner";
import { DirectoryColumns } from "@/components/sections/directory-columns";
import { FaqAccordion } from "@/components/sections/faq-accordion";
import { HighlightGrid } from "@/components/sections/highlight-grid";
import { LinkGrid } from "@/components/sections/link-grid";
import { LogoBelt } from "@/components/sections/logo-belt";
import { MapFrame } from "@/components/sections/map-frame";
import { PageHero } from "@/components/sections/page-hero";
import { PricingBand } from "@/components/sections/pricing-band";
import { ReviewGrid } from "@/components/sections/review-grid";
import { SectionFrame } from "@/components/sections/section-frame";
import { ServiceCardGrid } from "@/components/sections/service-card-grid";
import { ServiceAreaDirectory } from "@/components/sections/service-area-directory";
import { ServiceAreaGroups } from "@/components/sections/service-area-groups";
import { TabRail } from "@/components/sections/tab-rail";
import {
  extractProofItems,
  splitContentBody,
  toLinkItemsFromContent,
} from "@/lib/content/section-helpers";
import { getAllPages } from "@/lib/content/site-index";
import { heroImages } from "@/lib/design";
import type {
  AnyPagePayload,
  BulletColumnsSection,
  ContentSection,
  LinkListSection,
  PageFamily,
  PricingTilesSection,
  RichTextSection,
} from "@/lib/content/types";
import { getPrimaryHeading } from "@/lib/content/site-index";
import type { PageEntry } from "@/lib/site-schema";

interface SectionContext {
  page: PageEntry;
  payload: AnyPagePayload;
  family: PageFamily;
  overallIndex: number;
  kindIndex: number;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSectionAnchor(section: ContentSection, overallIndex: number) {
  const basis =
    "heading" in section && section.heading
      ? slugify(section.heading)
      : `${section.kind}-${overallIndex + 1}`;

  return basis || `${section.kind}-${overallIndex + 1}`;
}

function renderReading(body: string) {
  const segments = splitContentBody(body);

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="bftp-reading">
      {segments.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

function getFamilyHeroVariant(family: PageFamily) {
  return family === "homepage" ||
    family === "core_service" ||
    family === "about_page" ||
    family === "contact_page" ||
    family === "service_area_hub" ||
    family === "county_service_hub"
    ? "photo"
    : "navy";
}

const localHeroOverrides: Record<string, string> = {
  "/": "/assets/heroes/testing-home.avif",
  "/about-us": "/assets/heroes/about-hero.avif",
  "/contact-backflowtestpros": "/assets/photos/general-3.jpg",
  "/backflow-testing": "/assets/photos/general-1.jpg",
  "/backflow-repair-replacement-services": "/assets/heroes/repair-hero.jpg",
  "/backflow-installation": "/assets/heroes/installation-hero.jpg",
};

function getHeroImage(page: PageEntry, payload: AnyPagePayload) {
  const localOverride = localHeroOverrides[page.path];

  if (localOverride) {
    return localOverride;
  }

  if (payload.heroImage) {
    return payload.heroImage;
  }

  if (payload.family === "commercial_vertical") {
    return heroImages[3]?.src;
  }

  if (payload.family === "service_area_hub") {
    return heroImages[3]?.src;
  }

  if (payload.family === "core_service") {
    if (/installation/i.test(page.path)) {
      return heroImages[1]?.src;
    }

    if (/repair/i.test(page.path)) {
      return heroImages[2]?.src;
    }
  }

  return heroImages[0]?.src;
}

function getSectionTone(
  family: PageFamily,
  section: ContentSection,
  kindIndex: number,
) {
  switch (family) {
    case "homepage":
      if (section.kind === "link_list" && kindIndex === 0) {
        return "navy";
      }
      if (section.kind === "pricing_tiles" || (section.kind === "link_list" && kindIndex === 2)) {
        return "band";
      }
      return "surface";
    case "core_service":
      if (section.kind === "pricing_tiles" || section.kind === "bullet_columns") {
        return "band";
      }
      if (section.kind === "link_list") {
        return "navy";
      }
      return "surface";
    case "county_city_landing":
      if (section.kind === "bullet_columns") {
        return "navy";
      }
      if (section.kind === "link_list") {
        return "band";
      }
      return "surface";
    case "service_area_hub":
      if (section.kind === "bullet_columns") {
        return "band";
      }
      return "surface";
    case "commercial_vertical":
      if (section.kind === "pricing_tiles") {
        return "band";
      }
      if (section.kind === "rich_text" && kindIndex > 0 && kindIndex % 2 === 1) {
        return "navy";
      }
      return "surface";
    case "county_service_hub":
      if (section.kind === "pricing_tiles" || section.kind === "bullet_columns") {
        return "band";
      }
      return "surface";
    case "regulation_page":
      if (section.kind === "bullet_columns") {
        return "band";
      }
      if (section.kind === "link_list" && kindIndex === 1) {
        return "navy";
      }
      return "surface";
    default:
      return "surface";
  }
}

function getSectionAlign(family: PageFamily, section: ContentSection) {
  if (family === "county_city_landing" && section.kind === "bullet_columns") {
    return "left";
  }

  return "center";
}

function getServiceAreaCountyName(context: SectionContext) {
  return context.payload.family === "service_area_hub"
    ? context.payload.countyName
    : context.page.countyLabel;
}

function isReviewFeatureSection(
  section: Extract<ContentSection, { kind: "feature_cards" }>,
) {
  const fingerprint = `${section.sourceClass} ${section.heading}`.toLowerCase();

  return (
    fingerprint.includes("testimonial") ||
    fingerprint.includes("review") ||
    fingerprint.includes("trusted by residential") ||
    fingerprint.includes("trusted by leading brands")
  );
}

function isCredentialFeatureSection(
  section: Extract<ContentSection, { kind: "feature_cards" }>,
) {
  return section.sourceClass.toLowerCase().includes("certifiedby-city-water-departments");
}

function isAwwaCertificationLinkList(section: LinkListSection) {
  const fingerprint = `${section.sourceClass} ${section.heading}`.toLowerCase();

  return (
    fingerprint.includes("certifiedby-city-water-departments") ||
    fingerprint.includes("awwa certified backflow testers cross connection control")
  );
}

function isServiceAccordionSection(
  section: Extract<ContentSection, { kind: "feature_cards" }>,
) {
  return section.sourceClass.toLowerCase().includes("backflow-prevention-services");
}

function isBenefitsFeatureSection(
  section: Extract<ContentSection, { kind: "feature_cards" }>,
) {
  const sc = section.sourceClass.toLowerCase();
  return (
    sc.includes("backflow-testing-benefits") ||
    sc.includes("backflow-repair-benefits") ||
    sc.includes("backflow-installation-benefits") ||
    sc.includes("premium-service")
  );
}

function isEverythingDoneSection(section: ContentSection) {
  return (
    "heading" in section &&
    section.heading.toLowerCase().startsWith("everything done for you")
  );
}

function collapseServiceAreaColumns(columns: string[][]) {
  const localityGroups = columns.map((items) => items.map(extractLocalityFromListItem));

  if (localityGroups.length < 2) {
    return null;
  }

  const [firstGroup, ...restGroups] = localityGroups;

  if (
    firstGroup.length === 0 ||
    restGroups.some(
      (group) =>
        group.length !== firstGroup.length ||
        group.some((locality, index) => locality !== firstGroup[index]),
    )
  ) {
    return null;
  }

  return firstGroup.filter((locality, index, all) => all.indexOf(locality) === index);
}

function mergeServiceAreaColumns(columns: string[][]) {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const column of columns) {
    for (const item of column) {
      const locality = extractLocalityFromListItem(item);

      if (!locality || seen.has(locality)) {
        continue;
      }

      seen.add(locality);
      merged.push(locality);
    }
  }

  return merged;
}

function buildBulletGroups(section: BulletColumnsSection, context: SectionContext) {
  if (context.family === "county_city_landing") {
    return section.columns.map((items, index) => ({
      heading:
        index === 0
          ? "Backflow Test Pros Turn-key Backflow Maintenance Includes"
          : "Regional Operations Support",
      items,
    }));
  }

  if (context.family === "core_service") {
    const serviceLabel =
      context.payload.family === "core_service" && context.payload.serviceKind
        ? context.payload.serviceKind.replace(/\b\w/g, (character) => character.toUpperCase())
        : "Backflow";

    return section.columns.map((items, index) => ({
      heading:
        index === 0
          ? `Orange County ${serviceLabel} Service Areas`
          : index === 1
            ? `Los Angeles County ${serviceLabel} Service Areas`
            : `Additional ${serviceLabel} Service Areas ${index + 1}`,
      items,
    }));
  }

  if (context.family === "service_area_hub") {
    const collapsedLocalities = collapseServiceAreaColumns(section.columns);
    const featureSection = context.payload.sections.find(
      (candidate) => candidate.kind === "feature_cards",
    );

    if (collapsedLocalities) {
      return [
        {
          heading: section.heading,
          items: collapsedLocalities,
        },
      ];
    }

    return section.columns.map((items, index) => ({
      heading:
        featureSection?.kind === "feature_cards"
          ? featureSection.cards[index]?.title ?? `Coverage Group ${index + 1}`
          : `Coverage Group ${index + 1}`,
      items,
    }));
  }

  if (context.family === "county_service_hub") {
    const countyPayload = context.payload as Extract<
      AnyPagePayload,
      { family: "county_service_hub" }
    >;

    return section.columns.map((items, index) => ({
      heading:
        index === 0
          ? `${countyPayload.countyName} Installation Service Areas`
          : `${countyPayload.countyName} Additional Service Areas`,
      items,
    }));
  }

  if (context.payload.family === "regulation_page") {
    const regulationPayload = context.payload;

    return section.columns.map((items, index) => ({
      heading:
        index === 0
          ? `${regulationPayload.countyName} Water Authority Coverage`
          : `${regulationPayload.countyName} Municipality Directory`,
      items,
    }));
  }

  return section.columns.map((items, index) => ({
    heading: `Group ${index + 1}`,
    items,
  }));
}

function resolveCountySegmentFromHeading(heading: string) {
  const value = heading.toLowerCase();

  if (value.includes("orange county")) {
    return "orange-county";
  }

  if (value.includes("los angeles county")) {
    return "la-county";
  }

  if (value.includes("san bernardino county")) {
    return "san-bernardino-county";
  }

  if (value.includes("riverside county")) {
    return "riverside-county";
  }

  if (value.includes("ventura county")) {
    return "ventura-county";
  }

  if (value.includes("san diego county")) {
    return "san-diego-county";
  }

  return undefined;
}

function slugifyLocality(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractLocalityFromListItem(item: string) {
  const trimmed = item.trim();
  const explicitIn = trimmed.match(/\bin\s+(.+)$/i);

  if (explicitIn?.[1]) {
    return explicitIn[1].trim();
  }

  const serviceSuffixes = [
    / annual backflow test services?$/i,
    / backflow installation (?:testing|test) and repair services?$/i,
    / backflow installation testing and repair services?$/i,
    / backflow installation services?$/i,
    / backflow preventer installation services?$/i,
    / backflow preventer testing services?$/i,
    / backflow testing services?$/i,
    / backflow repair services?$/i,
    / water services? backflow installation(?: and)? testing requirements$/i,
    / water division backflow installation(?: and)? testing requirements$/i,
    / water system backflow installation(?: and)? testing requirements$/i,
    / water and sewer division backflow installation(?: and)? testing requirements$/i,
  ];

  for (const suffix of serviceSuffixes) {
    if (suffix.test(trimmed)) {
      return trimmed.replace(suffix, "").trim();
    }
  }

  return trimmed;
}

function extractCitySlugFromPagePath(path: string) {
  const lastSegment = path.split("/").filter(Boolean).pop() ?? "";

  return lastSegment
    .replace(/-backflow-testing-installation-repair$/, "")
    .replace(/-backflow-testing-and-repair$/, "")
    .replace(/-backflow-testing-repair$/, "")
    .replace(/-backflow-installation-testing-repair$/, "")
    .replace(/-backflow-installation-repair$/, "")
    .replace(/-backflow-installation$/, "")
    .replace(/-backflow-repair-replacement-services$/, "")
    .replace(/-backflow-repair$/, "");
}

function resolveCityPath(heading: string, item: string) {
  const countySegment = resolveCountySegmentFromHeading(heading);

  if (!countySegment) {
    return undefined;
  }

  const citySlug = slugifyLocality(extractLocalityFromListItem(item));
  const pages = getAllPages().filter(
    (candidate) =>
      candidate.templateFamily === "county_city_landing" &&
      candidate.countySegment === countySegment &&
      extractCitySlugFromPagePath(candidate.path) === citySlug,
  );

  const preferredPage =
    pages.find((candidate) => candidate.path.endsWith("-backflow-testing-installation-repair")) ??
    pages.find((candidate) => candidate.path.endsWith("-backflow-testing-and-repair")) ??
    pages[0];

  return preferredPage?.path;
}

function resolveHeroPromoText({
  rawPromoText,
  primaryAction,
}: {
  rawPromoText?: string;
  primaryAction: { href: string; label: string };
}) {
  const normalizedPromo = rawPromoText?.trim() ?? "";
  const isPlaceholderPromo =
    !normalizedPromo ||
    normalizedPromo === "call_now" ||
    /^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(normalizedPromo);

  const resolvedPromo = isPlaceholderPromo
    ? ""
    : normalizedPromo.replaceAll("_", " ");

  if (!resolvedPromo) {
    return undefined;
  }

  return resolvedPromo.toLowerCase() === primaryAction.label.trim().toLowerCase()
    ? undefined
    : resolvedPromo;
}

function renderHeroSection(context: SectionContext) {
  const hero = context.payload.hero;

  if (!hero) {
    if (context.family === "legal_page") {
      return null;
    }

    return (
      <PageHero
        eyebrow=""
        title={getPrimaryHeading(context.page)}
        subtitle={context.payload.metaDescription || context.page.description}
        bodyLines={splitContentBody(context.payload.metaDescription || context.page.description)}
        heroVariant={getFamilyHeroVariant(context.family)}
        heroImageSrc={getHeroImage(context.page, context.payload)}
      />
    );
  }

  const heroPrimaryAction = hero.primaryCta
    ? { href: hero.primaryCta.href, label: hero.primaryCta.label }
    : undefined;
  const heroPhoneAction =
    hero.phoneCta?.href.startsWith("tel:")
      ? { href: hero.phoneCta.href, label: hero.phoneCta.label }
      : undefined;
  const fallbackPhoneAction = {
    href: "tel:18008036658",
    label: "(800) 803-6658",
  };
  const primaryAction = heroPhoneAction ?? heroPrimaryAction ?? fallbackPhoneAction;
  const rawPromoText = context.payload.ctaPattern[0] || context.page.headings.h3[0];
  const promoText = resolveHeroPromoText({
    rawPromoText,
    primaryAction,
  });

  return (
    <PageHero
      eyebrow=""
      title={hero.heading || getPrimaryHeading(context.page)}
      subtitle={context.payload.metaDescription || context.page.description}
      bodyLines={splitContentBody(hero.body || context.payload.metaDescription)}
      promoText={promoText}
      primaryAction={primaryAction}
      heroVariant={getFamilyHeroVariant(context.family)}
      heroImageSrc={getHeroImage(context.page, context.payload)}
    />
  );
}

function renderPricingSection(section: PricingTilesSection, context: SectionContext) {
  return (
    <SectionFrame
      id={buildSectionAnchor(section, context.overallIndex)}
      tone={getSectionTone(context.family, section, context.kindIndex)}
      align={getSectionAlign(context.family, section)}
      title={<h2 className="bftp-section-title">{section.heading}</h2>}
      body={renderReading(section.body)}
    >
      <PricingBand
        items={section.tiles.map((tile) => ({
          label: tile.title,
          price: tile.price,
          detail: tile.detail,
        }))}
      />
    </SectionFrame>
  );
}

function renderLinkListSection(section: LinkListSection, context: SectionContext) {
  const items = toLinkItemsFromContent(section.items);
  const hideLinkedResources =
    context.family === "homepage" && isAwwaCertificationLinkList(section);
  const isServiceAreaHubCountyDirectory =
    context.family === "service_area_hub" &&
    section.heading.trim().toLowerCase() === "browse counties";
  const renderAsServiceCards =
    context.family === "homepage" && context.kindIndex === 1;
  const renderAsDirectoryCard =
    items.length >= 12 &&
    !renderAsServiceCards;
  const renderAsServiceAreaDirectory =
    renderAsDirectoryCard;
  const variant =
    isServiceAreaHubCountyDirectory
      ? "county-directory"
      : context.family === "homepage" && context.kindIndex === 0
        ? "compact"
        : "directory";

  return (
    <SectionFrame
      id={buildSectionAnchor(section, context.overallIndex)}
      className={hideLinkedResources ? "bftp-frame--center-only" : undefined}
      tone={getSectionTone(context.family, section, context.kindIndex)}
      align={getSectionAlign(context.family, section)}
      title={<h2 className="bftp-section-title">{section.heading}</h2>}
      body={renderReading(section.body)}
    >
      {hideLinkedResources ? null : renderAsServiceCards ? (
        <ServiceCardGrid items={items} />
      ) : renderAsServiceAreaDirectory ? (
        <ServiceAreaDirectory
          page={context.page}
          heading={section.heading}
          items={items}
        />
      ) : (
        <LinkGrid items={items} variant={variant} />
      )}
      {!hideLinkedResources && section.map ? <MapFrame map={section.map} /> : null}
    </SectionFrame>
  );
}

function isManagedMaintenanceSection(section: BulletColumnsSection) {
  return (section as { sourceClass?: string }).sourceClass
    ?.toLowerCase()
    .includes("managed-backflow-maintenance") ?? false;
}

function renderBulletColumnsSection(section: BulletColumnsSection, context: SectionContext) {
  if (context.family === "core_service") {
    return (
      <SectionFrame
        id={buildSectionAnchor(section, context.overallIndex)}
        tone={getSectionTone(context.family, section, context.kindIndex)}
        align="center"
      >
        <ProofMarquee
          items={section.columns.flat().filter(Boolean)}
        />
      </SectionFrame>
    );
  }

  if (context.family === "about_page" && isManagedMaintenanceSection(section)) {
    return (
      <SectionFrame
        id={buildSectionAnchor(section, context.overallIndex)}
        tone={getSectionTone(context.family, section, context.kindIndex)}
        align="left"
      >
        <SplitChecklist
          heading={section.heading}
          body={section.body}
          groups={section.columns.map((items) => ({ items }))}
        />
      </SectionFrame>
    );
  }

  const groups = buildBulletGroups(section, context);
  const mergedServiceAreaLocalities =
    context.family === "service_area_hub" ? mergeServiceAreaColumns(section.columns) : [];
  const totalItems = section.columns.reduce((sum, column) => sum + column.length, 0);
  const renderAsServiceAreaGroups = totalItems >= 24;
  const renderAsMergedServiceAreaDirectory =
    context.family === "service_area_hub" &&
    mergedServiceAreaLocalities.length > 0;
  const renderAsSingleServiceAreaDirectory =
    context.family === "service_area_hub" &&
    groups.length === 1 &&
    groups[0] &&
    groups[0].items.length > 0;

  return (
    <SectionFrame
      id={buildSectionAnchor(section, context.overallIndex)}
      tone={getSectionTone(context.family, section, context.kindIndex)}
      align={getSectionAlign(context.family, section)}
      title={<h2 className="bftp-section-title">{section.heading}</h2>}
      body={renderReading(section.body)}
    >
      {renderAsMergedServiceAreaDirectory ? (
        <ServiceAreaDirectory
          page={context.page}
          heading={
            getServiceAreaCountyName(context)
              ? `${getServiceAreaCountyName(context)} Service Areas`
              : section.heading
          }
          items={mergedServiceAreaLocalities.map((item) => ({
            label: item,
            href:
              resolveCityPath(
                getServiceAreaCountyName(context)
                  ? `${getServiceAreaCountyName(context)} Service Areas`
                  : section.heading,
                item,
              ) ?? "",
          }))}
          hideLogos={context.family === "service_area_hub"}
          defaultExpanded={context.family === "service_area_hub"}
          hideToggle={context.family === "service_area_hub"}
        />
      ) : renderAsSingleServiceAreaDirectory ? (
        <ServiceAreaDirectory
          page={context.page}
          heading={groups[0].heading}
          items={groups[0].items.map((item) => ({
            label: item,
            href: resolveCityPath(groups[0].heading, item) ?? "",
          }))}
          hideLogos={context.family === "service_area_hub"}
          defaultExpanded={context.family === "service_area_hub"}
          hideToggle={context.family === "service_area_hub"}
        />
      ) : renderAsServiceAreaGroups ? (
        <ServiceAreaGroups
          page={context.page}
          groups={groups.map((group) => ({
            heading: group.heading,
            items: group.items.map((item) => ({
              label: item,
              href: resolveCityPath(group.heading, item) ?? "",
            })),
          }))}
        />
      ) : (
        <DirectoryColumns
          groups={groups}
          variant={context.family === "county_city_landing" ? "split" : "stack"}
        />
      )}
    </SectionFrame>
  );
}

function renderRichTextSection(section: RichTextSection, context: SectionContext) {
  const proofItems = extractProofItems(section.body);
  const isExplicitProofStrip = section.sourceClass.toLowerCase().includes("marquee-simple-item");
  const shouldRenderProofStrip =
    proofItems.length > 0 &&
    (isExplicitProofStrip ||
      context.family === "homepage" ||
      context.family === "core_service" ||
      context.family === "commercial_vertical") &&
    (isExplicitProofStrip || context.kindIndex === 0);

  if (shouldRenderProofStrip) {
    return <ProofMarquee items={proofItems} />;
  }

  const isCommercialCta =
    context.family === "commercial_vertical" && context.kindIndex >= 4;

  return (
    <SectionFrame
      id={buildSectionAnchor(section, context.overallIndex)}
      tone={getSectionTone(context.family, section, context.kindIndex)}
      align={getSectionAlign(context.family, section)}
      title={
        section.heading ? <h2 className="bftp-section-title">{section.heading}</h2> : undefined
      }
      body={renderReading(section.body)}
      inset={
        context.family === "legal_page" || context.family === "about_page"
          ? "reading"
          : "wide"
      }
    >
      {section.links.length > 0 ? (
        <LinkGrid
          items={toLinkItemsFromContent(section.links)}
          variant={context.family === "regulation_page" ? "compact" : "directory"}
        />
      ) : null}
      {isCommercialCta ? (
        <div className="mx-auto mt-8 w-full max-w-[920px] overflow-hidden">
          <Image
            src={getHeroImage(context.page, context.payload) ?? heroImages[3]?.src ?? heroImages[0].src}
            alt={context.payload.heroImage ? context.payload.h1 : heroImages[3]?.alt ?? heroImages[0].alt}
            width={920}
            height={460}
            priority={false}
            sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 991px) calc(100vw - 40px), 920px"
            className="h-auto w-full"
          />
        </div>
      ) : null}
    </SectionFrame>
  );
}

export function ContentSectionRenderer({
  page,
  payload,
  section,
  family,
  overallIndex,
  kindIndex,
}: {
  page: PageEntry;
  payload: AnyPagePayload;
  section: ContentSection;
  family: PageFamily;
  overallIndex: number;
  kindIndex: number;
}) {
  const context: SectionContext = {
    page,
    payload,
    family,
    overallIndex,
    kindIndex,
  };

  switch (section.kind) {
    case "hero":
      return renderHeroSection(context);
    case "logo_strip":
      return (
        <LogoBelt
          logos={section.logos}
          useGlobalSet={section.logos.length === 0 && kindIndex === 0}
        />
      );
    case "feature_cards": {
      const suppressCountyHubBenefitShowcase =
        family === "service_area_hub" &&
        page.path !== "/backflow-testing-installation-repair-service-areas" &&
        isBenefitsFeatureSection(section);
      const suppressReviewSection =
        isReviewFeatureSection(section) &&
        (family === "service_area_hub" || family === "county_service_hub");
      const useFeatureSplit =
        (family === "core_service" &&
          !isReviewFeatureSection(section) &&
          !isCredentialFeatureSection(section) &&
          !isBenefitsFeatureSection(section));
      const useBenefitShowcase = isBenefitsFeatureSection(section);

      if (suppressReviewSection || suppressCountyHubBenefitShowcase) {
        return null;
      }

      return (
        <SectionFrame
          id={buildSectionAnchor(section, overallIndex)}
          className={isEverythingDoneSection(section) ? "bftp-frame--everything-done" : undefined}
          tone={getSectionTone(family, section, kindIndex)}
          align={useFeatureSplit ? "left" : getSectionAlign(family, section)}
          title={
            useFeatureSplit || useBenefitShowcase
              ? undefined
              : <h2 className="bftp-section-title">{section.heading}</h2>
          }
          body={useFeatureSplit || useBenefitShowcase ? undefined : renderReading(section.body)}
        >
          {isReviewFeatureSection(section) ? (
            family === "about_page" ? (
              <ClientReviewCarousel items={section.cards} />
            ) : (
              <ReviewGrid items={section.cards} />
            )
          ) : isCredentialFeatureSection(section) ? (
            <ProofMarquee
              items={section.cards.map((card) => card.title).filter(Boolean)}
            />
          ) : family === "homepage" && isServiceAccordionSection(section) ? (
            <ServiceTriad items={section.cards} />
          ) : useBenefitShowcase ? (
            <BenefitShowcase
              heading={section.heading}
              body={section.body}
              items={section.cards}
              ctaLabel={section.links?.[0]?.label}
              ctaHref={section.links?.[0]?.href}
            />
          ) : family === "core_service" ? (
            <FeatureSplit
              heading={section.heading}
              body={section.body}
              items={section.cards}
            />
          ) : (
            <HighlightGrid items={section.cards} />
          )}
        </SectionFrame>
      );
    }
    case "pricing_tiles":
      return renderPricingSection(section, context);
    case "cta_banner":
      return (
        <CtaBanner
          heading={section.heading}
          body={section.body}
          ctaLabel={section.links[0]?.label}
          ctaHref={section.links[0]?.href}
          backgroundSrc={getHeroImage(page, payload)}
        />
      );
    case "tabbed_content":
      return (
        <SectionFrame
          id={buildSectionAnchor(section, overallIndex)}
          className={[
            "bftp-frame--tabbed-compact",
            isEverythingDoneSection(section) ? "bftp-frame--everything-done" : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
          tone={getSectionTone(family, section, kindIndex)}
          align={getSectionAlign(family, section)}
          title={<h2 className="bftp-section-title">{section.heading}</h2>}
        >
          <TabRail
            tabs={section.tabs}
            showPhotos
            titleMode={family === "about_page" ? "label" : "title"}
          />
        </SectionFrame>
      );
    case "bullet_columns":
      return renderBulletColumnsSection(section, context);
    case "link_list":
      return renderLinkListSection(section, context);
    case "faq_accordion":
      return (
        <SectionFrame
          id={buildSectionAnchor(section, overallIndex)}
          tone={getSectionTone(family, section, kindIndex)}
          align={getSectionAlign(family, section)}
          title={<h2 className="bftp-section-title">{section.heading}</h2>}
          body={null}
        >
          <FaqAccordion items={section.items} />
        </SectionFrame>
      );
    case "rich_text":
      return renderRichTextSection(section, context);
    case "form_section":
      return (
        <SectionFrame
          id={buildSectionAnchor(section, overallIndex)}
          tone={getSectionTone(family, section, kindIndex)}
          align={family === "contact_page" ? "center" : "left"}
          inset={family === "contact_page" ? "reading" : "wide"}
          title={<h2 className="bftp-section-title">{section.heading}</h2>}
          body={renderReading(section.body)}
        >
          <ContactFormSection
            fields={section.fields}
            submitLabel={section.submitLabel}
            formAction={section.formAction}
            formMethod={section.formMethod}
            pagePath={context.page.path}
          />
        </SectionFrame>
      );
    default:
      return null;
  }
}
