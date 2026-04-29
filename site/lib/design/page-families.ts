export type PageFamilyId =
  | "coreService"
  | "countyCityLanding"
  | "serviceAreaHub"
  | "commercialVertical"
  | "faq"
  | "regulations"
  | "about";

type PageFamilyRule = {
  label: string;
  heroVariant: "photoOverlay" | "navyStatic";
  heroImageKey?: string;
  orderedModules: string[];
  spacing: {
    heroBlock: string;
    sectionBlock: string;
    sectionGap: string;
  };
  layout: {
    titleMeasure: string;
    copyMeasure: string;
    listColumns: number;
    prefersTabs: boolean;
    includesMap: boolean;
  };
  responsiveNotes: string[];
  fidelityNotes: string[];
};

export const sharedModuleClassMap = {
  topBar: "bftp-topbar",
  navbar: "bftp-navbar",
  hero: "bftp-hero",
  logoBelt: "bftp-logo-belt",
  certificationBand: "bftp-band bftp-band--navy",
  featureGrid: "bftp-icon-grid",
  marqueeBand: "bftp-marquee",
  pricingCluster: "bftp-pricing",
  serviceCardGrid: "bftp-service-grid",
  complianceTabs: "bftp-tab-panel",
  centeredLinkList: "bftp-link-list",
  mapFrame: "bftp-map-frame",
  footer: "bftp-footer",
} as const;

export const pageFamilyRules: Record<PageFamilyId, PageFamilyRule> = {
  coreService: {
    label: "Core service page",
    heroVariant: "photoOverlay",
    heroImageKey: "installationService",
    orderedModules: [
      "topBar",
      "navbar",
      "hero",
      "featureGrid",
      "pricingCluster",
      "complianceTabs",
      "serviceCardGrid",
      "centeredLinkList",
      "footer",
    ],
    spacing: {
      heroBlock: "var(--bftp-section-xl)",
      sectionBlock: "var(--bftp-section-lg)",
      sectionGap: "var(--bftp-stack-xl)",
    },
    layout: {
      titleMeasure: "14ch",
      copyMeasure: "980px",
      listColumns: 1,
      prefersTabs: true,
      includesMap: false,
    },
    responsiveNotes: [
      "Keep the hero copy centered on all breakpoints; only the nav collapses, not the hero composition.",
      "Feature cards collapse to a single stacked column below 991px.",
      "The pricing cluster needs a vertical stack on tablet/mobile to preserve readable labels.",
    ],
    fidelityNotes: [
      "Core pages alternate white sections and navy sections in a rigid rhythm.",
      "Installation and testing pages use the left-rail compliance tab pattern instead of accordions.",
      "Service card media should keep the decorative gray/white underlay shapes.",
    ],
  },
  countyCityLanding: {
    label: "County/city landing page",
    heroVariant: "navyStatic",
    orderedModules: [
      "topBar",
      "navbar",
      "hero",
      "featureGrid",
      "pricingCluster",
      "certificationBand",
      "centeredLinkList",
      "mapFrame",
      "complianceTabs",
      "footer",
    ],
    spacing: {
      heroBlock: "var(--bftp-section-xl)",
      sectionBlock: "var(--bftp-section-lg)",
      sectionGap: "var(--bftp-stack-lg)",
    },
    layout: {
      titleMeasure: "16ch",
      copyMeasure: "820px",
      listColumns: 1,
      prefersTabs: true,
      includesMap: true,
    },
    responsiveNotes: [
      "City pages keep the hero on a flat navy field instead of a photo-led backdrop.",
      "Maps should sit between the local service-area list and regulations tab block on desktop and mobile.",
      "Pricing and certification callouts need to stay centered instead of becoming side-by-side cards.",
    ],
    fidelityNotes: [
      "The navy hero, white body, navy urgency band, map, and regulations tab stack is the key city-page fingerprint.",
      "Local service-area lists are long, narrow, and vertically centered rather than broad multi-column link farms.",
    ],
  },
  serviceAreaHub: {
    label: "Service-area hub",
    heroVariant: "photoOverlay",
    heroImageKey: "commercialVertical",
    orderedModules: [
      "topBar",
      "navbar",
      "hero",
      "featureGrid",
      "certificationBand",
      "centeredLinkList",
      "footer",
    ],
    spacing: {
      heroBlock: "var(--bftp-section-lg)",
      sectionBlock: "var(--bftp-section-md)",
      sectionGap: "var(--bftp-stack-lg)",
    },
    layout: {
      titleMeasure: "15ch",
      copyMeasure: "760px",
      listColumns: 1,
      prefersTabs: false,
      includesMap: false,
    },
    responsiveNotes: [
      "Hub pages are visually lighter: compress section spacing before removing modules.",
      "Keep the city-link list in one column on all breakpoints because the live site reads like an index.",
    ],
    fidelityNotes: [
      "These pages lean on proof logos plus oversized link stacks rather than explanatory editorial content.",
      "The page should feel sparse, not feature-rich.",
    ],
  },
  commercialVertical: {
    label: "Commercial vertical page",
    heroVariant: "photoOverlay",
    heroImageKey: "commercialVertical",
    orderedModules: [
      "topBar",
      "navbar",
      "hero",
      "featureGrid",
      "serviceCardGrid",
      "pricingCluster",
      "centeredLinkList",
      "footer",
    ],
    spacing: {
      heroBlock: "var(--bftp-section-xl)",
      sectionBlock: "var(--bftp-section-lg)",
      sectionGap: "var(--bftp-stack-xl)",
    },
    layout: {
      titleMeasure: "15ch",
      copyMeasure: "920px",
      listColumns: 1,
      prefersTabs: false,
      includesMap: false,
    },
    responsiveNotes: [
      "Vertical pages still use centered headings, but the hero image should do more of the storytelling.",
      "Keep service imagery bold on mobile; avoid cropping the subject off-center.",
    ],
    fidelityNotes: [
      "Commercial pages feel more image-heavy and sales-led than county/city pages.",
      "Trust logos and service proof blocks carry more visual weight than regulation tabs here.",
    ],
  },
  faq: {
    label: "FAQ page",
    heroVariant: "navyStatic",
    orderedModules: [
      "topBar",
      "navbar",
      "hero",
      "certificationBand",
      "footer",
    ],
    spacing: {
      heroBlock: "var(--bftp-section-lg)",
      sectionBlock: "var(--bftp-section-md)",
      sectionGap: "var(--bftp-stack-lg)",
    },
    layout: {
      titleMeasure: "18ch",
      copyMeasure: "820px",
      listColumns: 1,
      prefersTabs: false,
      includesMap: false,
    },
    responsiveNotes: [
      "FAQ accordions should stay full width and use the captured plus/minus assets.",
      "Keep the footer weight identical to service pages so FAQ pages do not feel detached from the main site.",
    ],
    fidelityNotes: [
      "The FAQ experience is simple and text-forward, with styling carried by the shared hero/footer system.",
    ],
  },
  regulations: {
    label: "Regulations page",
    heroVariant: "navyStatic",
    orderedModules: [
      "topBar",
      "navbar",
      "hero",
      "certificationBand",
      "complianceTabs",
      "footer",
    ],
    spacing: {
      heroBlock: "var(--bftp-section-lg)",
      sectionBlock: "var(--bftp-section-lg)",
      sectionGap: "var(--bftp-stack-lg)",
    },
    layout: {
      titleMeasure: "17ch",
      copyMeasure: "900px",
      listColumns: 1,
      prefersTabs: true,
      includesMap: false,
    },
    responsiveNotes: [
      "The regulations page keeps its left rail longer than other page families, so avoid converting it to accordions until below tablet.",
      "Authority logo strips should remain visible above the tab content when present.",
    ],
    fidelityNotes: [
      "This family feels like a policy page inside the same brand system, not a separate microsite.",
    ],
  },
  about: {
    label: "About page",
    heroVariant: "photoOverlay",
    orderedModules: [
      "topBar",
      "navbar",
      "hero",
      "certificationBand",
      "serviceCardGrid",
      "logoBelt",
      "footer",
    ],
    spacing: {
      heroBlock: "var(--bftp-section-xl)",
      sectionBlock: "var(--bftp-section-lg)",
      sectionGap: "var(--bftp-stack-xl)",
    },
    layout: {
      titleMeasure: "16ch",
      copyMeasure: "920px",
      listColumns: 1,
      prefersTabs: false,
      includesMap: false,
    },
    responsiveNotes: [
      "About needs the same hero treatment as the service pages, but with more breathing room before the first body section.",
    ],
    fidelityNotes: [
      "The about page still behaves like a sales page visually, not a quiet corporate bio page.",
      "A missing about-hero image remains a fidelity gap; use the shared overlay pattern until restored.",
    ],
  },
};
