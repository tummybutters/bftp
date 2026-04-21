import type { ComponentType } from "react";

import { CommercialVerticalTemplate } from "@/components/templates/commercial-vertical-template";
import { CoreServiceTemplate } from "@/components/templates/core-service-template";
import { CountyCityTemplate } from "@/components/templates/county-city-template";
import { GenericTemplate } from "@/components/templates/generic-template";
import { HomeTemplate } from "@/components/templates/home-template";
import { ServiceAreaHubTemplate } from "@/components/templates/service-area-hub-template";
import type { PageTemplateProps, TemplateFamily } from "@/lib/site-schema";

interface TemplateDefinition {
  label: string;
  sectionOrder: string[];
  component: ComponentType<PageTemplateProps>;
}

const templateRegistry: Partial<Record<TemplateFamily, TemplateDefinition>> = {
  homepage: {
    label: "Homepage",
    sectionOrder: [
      "services",
      "pricing",
      "coverage",
      "counties",
      "industries",
      "cta",
    ],
    component: HomeTemplate,
  },
  core_service: {
    label: "Core Service",
    sectionOrder: [
      "overview",
      "pricing",
      "compliance",
      "regulations",
      "service-areas",
      "related-services",
      "cta",
    ],
    component: CoreServiceTemplate,
  },
  county_city_landing: {
    label: "County City Landing",
    sectionOrder: [
      "pricing",
      "risk",
      "service-areas",
      "regulations",
      "nearby-cities",
      "cta",
    ],
    component: CountyCityTemplate,
  },
  service_area_hub: {
    label: "Service Area Hub",
    sectionOrder: ["brands", "coverage", "city-list", "county-links", "cta"],
    component: ServiceAreaHubTemplate,
  },
  commercial_vertical: {
    label: "Commercial Vertical",
    sectionOrder: [
      "overview",
      "value",
      "credentials",
      "risk",
      "requirements",
      "related-industries",
      "cta",
    ],
    component: CommercialVerticalTemplate,
  },
  about_page: {
    label: "About Page",
    sectionOrder: ["overview", "credentials", "operations", "cta"],
    component: GenericTemplate,
  },
  contact_page: {
    label: "Contact Page",
    sectionOrder: ["contact"],
    component: GenericTemplate,
  },
  county_service_hub: {
    label: "County Service Hub",
    sectionOrder: ["overview", "pricing", "services", "coverage"],
    component: GenericTemplate,
  },
  regulation_page: {
    label: "Regulation Page",
    sectionOrder: ["authorities", "regulations", "resources", "directory"],
    component: GenericTemplate,
  },
  legal_page: {
    label: "Legal Page",
    sectionOrder: ["policy"],
    component: GenericTemplate,
  },
};

const fallbackDefinition: TemplateDefinition = {
  label: "General Content",
  sectionOrder: ["overview", "details", "related-links", "cta"],
  component: GenericTemplate,
};

export function getTemplateDefinition(family: TemplateFamily): TemplateDefinition {
  return templateRegistry[family] ?? fallbackDefinition;
}
