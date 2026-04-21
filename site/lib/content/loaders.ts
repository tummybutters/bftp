import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  ArchivedPageDecision,
  AnyPagePayload,
  ContactPagePayload,
  CommercialVerticalPage,
  ContentAnomalyEntry,
  CoreServicePage,
  CountyCityLandingPage,
  CountyServiceHubPage,
  GeneratedPageIndex,
  GeneratedPageLookup,
  HomePagePayload,
  AboutPagePayload,
  LegalPagePayload,
  RegulationPagePayload,
  ServiceAreaHubPage,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "generated");

async function readJsonFile<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const fileContents = await readFile(filePath, "utf8");
  return JSON.parse(fileContents) as T;
}

export function loadCoreServicePages(): Promise<CoreServicePage[]> {
  return readJsonFile<CoreServicePage[]>("core-service-pages.json");
}

export function loadCountyCityPages(): Promise<CountyCityLandingPage[]> {
  return readJsonFile<CountyCityLandingPage[]>("county-city-pages.json");
}

export function loadServiceAreaHubs(): Promise<ServiceAreaHubPage[]> {
  return readJsonFile<ServiceAreaHubPage[]>("service-area-hubs.json");
}

export function loadCommercialVerticalPages(): Promise<CommercialVerticalPage[]> {
  return readJsonFile<CommercialVerticalPage[]>("commercial-vertical-pages.json");
}

export function loadHomePages(): Promise<HomePagePayload[]> {
  return readJsonFile<HomePagePayload[]>("home-pages.json");
}

export function loadAboutPages(): Promise<AboutPagePayload[]> {
  return readJsonFile<AboutPagePayload[]>("about-pages.json");
}

export function loadContactPages(): Promise<ContactPagePayload[]> {
  return readJsonFile<ContactPagePayload[]>("contact-pages.json");
}

export function loadCountyServiceHubs(): Promise<CountyServiceHubPage[]> {
  return readJsonFile<CountyServiceHubPage[]>("county-service-hubs.json");
}

export function loadRegulationPages(): Promise<RegulationPagePayload[]> {
  return readJsonFile<RegulationPagePayload[]>("regulation-pages.json");
}

export function loadLegalPages(): Promise<LegalPagePayload[]> {
  return readJsonFile<LegalPagePayload[]>("legal-pages.json");
}

export function loadArchivedPageDecisions(): Promise<ArchivedPageDecision[]> {
  return readJsonFile<ArchivedPageDecision[]>("archived-page-decisions.json");
}

export function loadContentAnomalies(): Promise<ContentAnomalyEntry[]> {
  return readJsonFile<ContentAnomalyEntry[]>("content-anomalies.json");
}

export function loadGeneratedPageIndex(): Promise<GeneratedPageIndex> {
  return readJsonFile<GeneratedPageIndex>("page-index.json");
}

export const loadGeneratedPageLookup = cache(function loadGeneratedPageLookup() {
  return readJsonFile<GeneratedPageLookup>("page-lookup.json");
});

export const loadPagePayloadByPath = cache(async function loadPagePayloadByPath(
  pathname: string,
): Promise<AnyPagePayload | undefined> {
  const lookup = await loadGeneratedPageLookup();
  return lookup.pagesByPath[pathname];
});
