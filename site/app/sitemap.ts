import type { MetadataRoute } from "next";

import { loadBlogIndex } from "@/lib/blog/loaders";
import { getAllPages } from "@/lib/content/site-index";
import { siteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const blogEntries = await loadBlogIndex();

  return [
    ...getAllPages().map((page) => ({
      url: page.canonical || `${siteConfig.url}${page.path}`,
      lastModified: now,
      changeFrequency: page.path === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: page.path === "/" ? 1 : page.depth <= 1 ? 0.8 : 0.6,
    })),
    {
      url: `${siteConfig.url}/blog`,
      lastModified: blogEntries[0]?.updatedAt ? new Date(blogEntries[0].updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    ...blogEntries.map((entry) => ({
      url: entry.canonical,
      lastModified: new Date(entry.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.68,
    })),
  ];
}
