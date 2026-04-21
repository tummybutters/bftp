export type AssetReference = {
  key: string;
  src: string;
  alt: string;
  usage: string[];
  notes?: string;
  beltScale?: number;
  beltWidth?: number;
  beltHeight?: number;
};

export const brandAssets = {
  navLogo: {
    key: "navLogo",
    src: "/assets/brand/nav-logo.png",
    alt: "Backflow Test Pros wordmark",
    usage: ["navbar", "light-background sections"],
  },
  footerLogo: {
    key: "footerLogo",
    src: "/assets/brand/footer-logo.png",
    alt: "Backflow Test Pros crest logo",
    usage: ["footer", "authority sections"],
  },
  whiteLogo: {
    key: "whiteLogo",
    src: "/assets/brand/logo-white.webp",
    alt: "Backflow Test Pros white logo",
    usage: ["dark hero lockups", "social sharing"],
  },
  favicon: {
    key: "favicon",
    src: "/assets/brand/favicon.ico",
    alt: "Backflow Test Pros favicon",
    usage: ["browser icon"],
  },
} as const;

export const featureIcons: AssetReference[] = [
  {
    key: "promoGift",
    src: "/assets/icons/promo-gift.svg",
    alt: "Promotion gift icon",
    usage: ["top bar promo", "coverage callout"],
  },
  {
    key: "phone",
    src: "/assets/icons/phone.svg",
    alt: "Phone icon",
    usage: ["top bar", "contact CTA"],
  },
  {
    key: "email",
    src: "/assets/icons/email.svg",
    alt: "Email icon",
    usage: ["top bar", "contact CTA"],
  },
  {
    key: "calendarBlue",
    src: "/assets/icons/calendar-blue.svg",
    alt: "Priority scheduling icon",
    usage: ["feature grid", "turnkey services"],
  },
  {
    key: "docsRetrievalBlue",
    src: "/assets/icons/docs-retrieval-blue.svg",
    alt: "Document retrieval icon",
    usage: ["feature grid", "city compliance blocks"],
  },
  {
    key: "repairCoverageBlue",
    src: "/assets/icons/repair-coverage-blue.svg",
    alt: "Repair coverage icon",
    usage: ["feature grid", "repair CTA"],
  },
  {
    key: "sameDayCertificationBlue",
    src: "/assets/icons/same-day-certification-blue.svg",
    alt: "Same-day certification icon",
    usage: ["feature grid", "testing benefits"],
  },
  {
    key: "money",
    src: "/assets/icons/money.svg",
    alt: "Money icon",
    usage: ["installation benefits", "pricing support"],
  },
  {
    key: "licensedCertified",
    src: "/assets/icons/licensed-certified.svg",
    alt: "Licensed certified icon",
    usage: ["installation benefits", "trust modules"],
  },
  {
    key: "freeTestIncluded",
    src: "/assets/icons/free-test-included.svg",
    alt: "Free test included icon",
    usage: ["installation benefits", "bundle callouts"],
  },
  {
    key: "expeditedService",
    src: "/assets/icons/expedited-service.svg",
    alt: "Expedited service icon",
    usage: ["repair benefits", "urgent service callouts"],
  },
  {
    key: "permitApproval",
    src: "/assets/icons/permit-approval.svg",
    alt: "Permit approval icon",
    usage: ["installation benefits", "compliance detail"],
  },
  {
    key: "waterDroplet",
    src: "/assets/icons/water-droplet.svg",
    alt: "Water droplet icon",
    usage: ["installation benefits", "hero support graphic"],
  },
  {
    key: "plus",
    src: "/assets/icons/plus.svg",
    alt: "Accordion closed icon",
    usage: ["FAQ accordions"],
  },
  {
    key: "minus",
    src: "/assets/icons/minus.svg",
    alt: "Accordion open icon",
    usage: ["FAQ accordions"],
  },
];

export const heroImages: AssetReference[] = [
  {
    key: "testingHome",
    src: "/assets/heroes/testing-home.avif",
    alt: "Backflow testing hero image",
    usage: ["home hero", "testing hero fallback"],
  },
  {
    key: "installationService",
    src: "/assets/heroes/installation-service.avif",
    alt: "Backflow installation hero image",
    usage: ["installation hero", "core service hero"],
  },
  {
    key: "repairService",
    src: "/assets/heroes/repair-service.avif",
    alt: "Backflow repair hero image",
    usage: ["repair hero", "core service hero"],
  },
  {
    key: "commercialVertical",
    src: "/assets/heroes/commercial-vertical.png",
    alt: "Commercial vertical hero image",
    usage: ["commercial vertical hero", "service-area hero accent"],
  },
];

export const serviceImages: AssetReference[] = [
  {
    key: "deviceTest",
    src: "/assets/services/device-test.avif",
    alt: "Backflow device testing service image",
    usage: ["service cards", "testing overview"],
  },
  {
    key: "deviceInstallation",
    src: "/assets/services/device-installation.avif",
    alt: "Backflow device installation service image",
    usage: ["service cards", "installation overview"],
  },
  {
    key: "deviceRepair",
    src: "/assets/services/device-repair.avif",
    alt: "Backflow device repair service image",
    usage: ["service cards", "repair overview"],
  },
  {
    key: "securityCage",
    src: "/assets/services/security-cage.avif",
    alt: "Backflow security cage service image",
    usage: ["repair pages", "security upsell blocks"],
  },
  {
    key: "arcoCaseStudy",
    src: "/assets/services/arco-case-study.avif",
    alt: "ARCO backflow repair case study image",
    usage: ["trust stories", "brand proof block"],
  },
];

export const decorativeShapes: AssetReference[] = [
  {
    key: "serviceCardGray",
    src: "/assets/shapes/service-card-gray.svg",
    alt: "Gray service card underlay",
    usage: ["service card media decoration"],
  },
  {
    key: "serviceCardWhite",
    src: "/assets/shapes/service-card-white.svg",
    alt: "White service card underlay",
    usage: ["service card media decoration"],
  },
];

export const clientLogos: AssetReference[] = [
  {
    key: "burgerKing",
    src: "/assets/logos/clients/burger-king.svg",
    alt: "Burger King logo",
    usage: ["home marquee", "trust section"],
    beltScale: 1.1,
    beltWidth: 1000,
    beltHeight: 1042,
  },
  {
    key: "costco",
    src: "/assets/logos/clients/costco.png",
    alt: "Costco logo",
    usage: ["home marquee", "testimonials support"],
    beltScale: 1.02,
    beltWidth: 1509,
    beltHeight: 422,
  },
  {
    key: "starbucks",
    src: "/assets/logos/clients/starbucks.png",
    alt: "Starbucks logo",
    usage: ["home marquee", "trust section"],
    beltScale: 1.12,
    beltWidth: 718,
    beltHeight: 711,
  },
  {
    key: "amc",
    src: "/assets/logos/clients/amc.png",
    alt: "AMC logo",
    usage: ["home marquee", "trust section"],
    beltScale: 1.02,
    beltWidth: 1442,
    beltHeight: 551,
  },
  {
    key: "chickFilA",
    src: "/assets/logos/clients/chick-fil-a.png",
    alt: "Chick-fil-A logo",
    usage: ["home marquee", "testimonial support"],
    beltScale: 1.02,
    beltWidth: 960,
    beltHeight: 427,
  },
  {
    key: "davita",
    src: "/assets/logos/clients/davita.png",
    alt: "Davita logo",
    usage: ["home marquee", "testimonial support"],
    beltScale: 1,
    beltWidth: 1456,
    beltHeight: 771,
  },
  {
    key: "inNOut",
    src: "/assets/logos/clients/in-n-out.png",
    alt: "In-N-Out logo",
    usage: ["home marquee", "service-area proof"],
    beltScale: 1.02,
    beltWidth: 1438,
    beltHeight: 716,
  },
  {
    key: "amazon",
    src: "/assets/logos/clients/amazon.svg",
    alt: "Amazon logo",
    usage: ["home marquee", "trust section"],
    beltScale: 0.94,
    beltWidth: 384,
    beltHeight: 120,
  },
  {
    key: "baskinRobbins",
    src: "/assets/logos/clients/baskin-robbins.png",
    alt: "Baskin-Robbins logo",
    usage: ["home marquee", "trust section"],
    beltScale: 0.74,
    beltWidth: 558,
    beltHeight: 86,
  },
  {
    key: "davesHotChicken",
    src: "/assets/logos/clients/daves-hot-chicken.png",
    alt: "Dave's Hot Chicken logo",
    usage: ["home marquee", "trust section"],
    beltScale: 1.08,
    beltWidth: 229,
    beltHeight: 230,
  },
];

export const authorityLogos: AssetReference[] = [
  {
    key: "orangeCountyWaterDistrict",
    src: "/assets/logos/authorities/orange-county-water-district.avif",
    alt: "Orange County Water District",
    usage: ["regulations pages", "authority recognition strip"],
  },
  {
    key: "losAngelesCountyWaterworks",
    src: "/assets/logos/authorities/los-angeles-county-waterworks.avif",
    alt: "Los Angeles County Waterworks Districts",
    usage: ["regulations pages", "authority recognition strip"],
  },
  {
    key: "ladwp",
    src: "/assets/logos/authorities/ladwp.avif",
    alt: "Los Angeles Department of Water and Power",
    usage: ["regulations pages", "authority recognition strip"],
  },
  {
    key: "awwa",
    src: "/assets/logos/authorities/awwa.avif",
    alt: "American Water Works Association",
    usage: ["home certification section", "regulations pages"],
  },
  {
    key: "stateWaterResourcesControlBoard",
    src: "/assets/logos/authorities/state-water-resources-control-board.avif",
    alt: "State Water Resources Control Board",
    usage: ["home certification section", "regulations pages"],
  },
  {
    key: "laCountyPublicHealth",
    src: "/assets/logos/authorities/la-county-public-health.gif",
    alt: "County of Los Angeles Public Health",
    usage: ["home certification section", "regulations pages"],
  },
];

export const socialIcons: AssetReference[] = [
  {
    key: "google",
    src: "/assets/social/google.svg",
    alt: "Google icon",
    usage: ["footer social row"],
  },
  {
    key: "googleMaps",
    src: "/assets/social/google-maps.svg",
    alt: "Google Maps icon",
    usage: ["footer social row"],
  },
  {
    key: "bing",
    src: "/assets/social/bing.svg",
    alt: "Bing icon",
    usage: ["footer social row"],
  },
  {
    key: "appleMaps",
    src: "/assets/social/apple-maps.svg",
    alt: "Apple Maps icon",
    usage: ["footer social row"],
  },
  {
    key: "facebook",
    src: "/assets/social/facebook.svg",
    alt: "Facebook icon",
    usage: ["footer social row"],
  },
  {
    key: "yelp",
    src: "/assets/social/yelp.svg",
    alt: "Yelp icon",
    usage: ["footer social row"],
  },
  {
    key: "bbb",
    src: "/assets/social/bbb.svg",
    alt: "Better Business Bureau icon",
    usage: ["footer social row"],
  },
  {
    key: "quora",
    src: "/assets/social/quora.svg",
    alt: "Quora icon",
    usage: ["footer social row"],
  },
  {
    key: "youtube",
    src: "/assets/social/youtube.svg",
    alt: "YouTube icon",
    usage: ["footer social row"],
  },
];

export const missingReferenceAssets = [
  {
    key: "aboutHeroReference",
    expectedSource:
      "https://cdn.prod.website-files.com/67bfdff7943122ff2def874b/6813e2f570565047a9e645c2_About%20Backflow%20Search%20Pros.avif",
    intendedUse: "About hero background",
    notes:
      "Referenced in captured CSS/HTML but not present in the forensic download bundle. Later round should fetch or recreate it.",
  },
  {
    key: "homeBackdropReference",
    expectedSource:
      "https://cdn.prod.website-files.com/67bfdff7943122ff2def874b/686599bb86ecfd4806f306a1_backflow%20testing.avif",
    intendedUse: "Home hero background",
    notes:
      "Referenced in Webflow CSS but missing from local forensic assets. Current system uses `testing-home.avif` as the nearest captured substitute.",
  },
  {
    key: "installationBackdropReference",
    expectedSource:
      "https://cdn.prod.website-files.com/67bfdff7943122ff2def874b/699c1b9c7a52bc8c6438127c_backflow%20assembly%20installation%20services.png",
    intendedUse: "Installation page hero background",
    notes:
      "Referenced in CSS but absent from the raw asset folder. Later round should restore the exact installation hero art.",
  },
  {
    key: "pricingPolygonBackgrounds",
    expectedSource:
      "https://cdn.prod.website-files.com/67bfdff7943122ff2def874b/67c0190d2ae7fe7cd6b003b0_Polygon-One.webp",
    intendedUse: "Pricing polygon background shapes",
    notes:
      "The live site uses image-backed polygons for price cards. Round 1 keeps a CSS diamond fallback until the source polygon assets are restored.",
  },
];

export const assetRegistry = {
  brandAssets,
  featureIcons,
  heroImages,
  serviceImages,
  decorativeShapes,
  clientLogos,
  authorityLogos,
  socialIcons,
  missingReferenceAssets,
} as const;
