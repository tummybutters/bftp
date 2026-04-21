import type { MetadataRoute } from "next";

import { getAllPages } from "@/lib/content/site-index";
import { siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return getAllPages().map((page) => ({
    url: page.canonical || `${siteConfig.url}${page.path}`,
    lastModified: now,
    changeFrequency: page.path === "/" ? "weekly" : "monthly",
    priority: page.path === "/" ? 1 : page.depth <= 1 ? 0.8 : 0.6,
  }));
}
