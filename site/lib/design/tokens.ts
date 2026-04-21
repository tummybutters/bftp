export const designTokens = {
  fonts: {
    body: '"PT Sans", "Lato", "Helvetica Neue", Arial, sans-serif',
    heading: '"PT Sans", "Lato", "Helvetica Neue", Arial, sans-serif',
    accent: '"Lato", "PT Sans", "Helvetica Neue", Arial, sans-serif',
  },
  colors: {
    navy: "#262e4a",
    navyDeep: "#1f2743",
    gold: "#ffb700",
    goldHover: "#ffbe19",
    text: "#6a6a6a",
    textStrong: "#262e4a",
    textSoft: "#7d8192",
    surface: "#ffffff",
    surfaceSoft: "#f6f6f6",
    surfaceBand: "#f5f5fb",
    border: "rgba(38, 46, 74, 0.12)",
    borderStrong: "rgba(38, 46, 74, 0.2)",
    footerBorder: "rgba(246, 246, 246, 0.05)",
    overlay: "rgba(38, 46, 74, 0.72)",
  },
  layout: {
    pageWidth: 1460,
    contentWidth: 1290,
    readingWidth: 820,
    serviceCopyWidth: 620,
    linkListWidth: 980,
    gutters: {
      desktop: 30,
      tablet: 20,
      mobile: 16,
    },
  },
  spacing: {
    sectionXl: 80,
    sectionLg: 60,
    sectionMd: 40,
    sectionSm: 24,
    stackXl: 50,
    stackLg: 30,
    stackMd: 20,
    stackSm: 12,
  },
  radius: {
    soft: 10,
    card: 18,
    pill: 999,
  },
  typography: {
    bodySize: 18,
    lineHeight: 1.4,
    heroTitle: "clamp(2.25rem, 4vw, 3.75rem)",
    sectionHeading: "clamp(2rem, 3.6vw, 3.375rem)",
    cardHeading: "clamp(1.25rem, 1.8vw, 1.6rem)",
    heroPhone: "clamp(1.65rem, 2.8vw, 2.2rem)",
  },
  motion: {
    fast: "180ms ease",
    base: "240ms ease",
    slow: "360ms ease",
  },
  shadows: {
    card: "0 18px 48px rgba(26, 32, 54, 0.08)",
    band: "0 10px 30px rgba(31, 39, 67, 0.08)",
    button: "0 10px 24px rgba(255, 183, 0, 0.2)",
  },
} as const;

export const liveSiteTraits = [
  "Centered section headings with restrained copy width and strong vertical whitespace.",
  "Deep navy bands alternate with bright white surfaces to break up long editorial pages.",
  "Gold is reserved for key emphasis only: hero headlines, active nav, footer headings, and CTA accents.",
  "Feature cards and tabs stay geometric and slightly old-school rather than rounded SaaS default styling.",
  "Service cards lean on decorative SVG underlays instead of shadows alone to create depth.",
] as const;

export const responsiveBreakpoints = {
  desktop: 1280,
  tablet: 991,
  mobile: 767,
} as const;

export type DesignTokens = typeof designTokens;
