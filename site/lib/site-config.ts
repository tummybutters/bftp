import { featureIcons, type AssetReference } from "@/lib/design";

export interface SiteNavItem {
  href: string;
  label: string;
}

export interface SiteOffice {
  heading: string;
  lines: string[];
}

const featureIconMap = new Map(featureIcons.map((icon) => [icon.key, icon]));

function requireFeatureIcon(key: string): AssetReference {
  const icon = featureIconMap.get(key);

  if (!icon) {
    throw new Error(`Missing design asset for feature icon "${key}".`);
  }

  return icon;
}

export const siteConfig = {
  name: "Backflow Test Pros",
  url: "https://www.backflowtestpros.com",
  description:
    "Certified Southern California backflow testing, installation, repair, and compliance support for residential, commercial, and municipal properties.",
  contactPath: "/contact-backflowtestpros",
  phone: {
    raw: "18008036658",
    display: "(800) 803-6658",
    href: "tel:18008036658",
  },
  promoBanner: {
    label: "Qualify for Free Backflow Repair Coverage",
    href: "/contact-backflowtestpros",
  },
  primaryNavigation: [
    { href: "/", label: "Home" },
    { href: "/about-us", label: "About" },
    { href: "/backflow-testing", label: "Backflow Testing" },
    {
      href: "/backflow-repair-replacement-services",
      label: "Backflow Repair",
    },
    { href: "/backflow-installation", label: "Backflow Installation" },
  ] as SiteNavItem[],
  footerNavigation: [
    { href: "/", label: "Home" },
    { href: "/about-us", label: "About Us" },
    { href: "/backflow-testing", label: "Backflow Preventer Testing" },
    {
      href: "/backflow-installation",
      label: "Backflow Preventer Installations",
    },
    {
      href: "/backflow-repair-replacement-services",
      label: "Backflow Preventer Repairs Replacements",
    },
    {
      href: "/orange-county-backflow-testing-installation-repair-service-areas",
      label: "Backflow Installation Testing & Repairs Service Areas",
    },
    { href: "/contact-backflowtestpros", label: "Contact Us" },
    { href: "/privacy-policy", label: "Privacy Policy" },
  ] as SiteNavItem[],
  footerAuthorities: [
    "Los Angeles County Water Departments",
    "Ventura County Water Departments",
    "Orange County Water Departments",
    "Riverside County Water Departments",
    "San Diego County Water Departments",
  ],
  footerRegulations: [
    "Orange County Backflow Regulations",
    "Los Angeles County Backflow Regulations",
  ],
  footerCopy: [
    "Backflow Test Pros is a bonded and insured CA Licensed Contractor and American Water Works Association (AWWA) Certified Cross Connection Control + Backflow Testing Specialist 100% dedicated to helping Southern California property owners meet backflow prevention compliance requirements.",
    "With a reputation built on expertise, integrity, and customer satisfaction; Backflow Test Pros manages your backflow prevention concerns so you can avoid water service interruptions and liabilities.",
  ],
  offices: [
    {
      heading: "Los Angeles County",
      lines: [
        "Backflow Test Pros - LA",
        "1150 S Olive St, 10th Floor",
        "Los Angeles, CA 90015",
        "(310) 753-7325",
        "7AM-8 PM Mon.-Fri.",
        "9AM-5 PM Sat. & Sun",
      ],
    },
    {
      heading: "Orange County",
      lines: [
        "Backflow Test Pros - OC",
        "2211 Michelson Dr, 9th Floor",
        "Irvine, CA 92612",
        "(714) 852-1213",
        "7AM-8 PM Mon.-Fri.",
        "9AM-5 PM Sat. & Sun",
      ],
    },
    {
      heading: "San Diego County",
      lines: [
        "Backflow Test Pros - San Diego",
        "600 B Street, Suite 300",
        "San Diego, CA 92101",
        "(619) 415-6937",
        "7AM-8 PM Mon.-Fri.",
        "9AM-5 PM Sat. & Sun",
      ],
    },
  ] as SiteOffice[],
} as const;

export const siteIcons = {
  promoGift: requireFeatureIcon("promoGift"),
  phone: requireFeatureIcon("phone"),
  email: requireFeatureIcon("email"),
} as const;
