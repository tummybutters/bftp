import type { Metadata } from "next";

import { siteConfig } from "@/lib/site-config";
import type { BlogIndexEntry, BlogPost, PublicBlogPost } from "./types";

function toAbsoluteUrl(pathname: string) {
  return pathname.startsWith("http") ? pathname : `${siteConfig.url}${pathname}`;
}

export function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function humanizeTemplateType(templateType: PublicBlogPost["templateType"]) {
  return templateType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function sanitizeJsonLd<T>(payload: T) {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

export function buildBlogHubMetadata(featuredPost?: BlogIndexEntry): Metadata {
  const title = "Blog";
  const description =
    "Source-backed backflow, plumbing, and facility water guidance for Southern California property owners, managers, and facility teams.";
  const canonical = `${siteConfig.url}/blog`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: canonical,
      siteName: siteConfig.name,
      images: featuredPost
        ? [
            {
              url: `${siteConfig.url}/assets/heroes/testing-home.avif`,
              alt: featuredPost.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: featuredPost ? [`${siteConfig.url}/assets/heroes/testing-home.avif`] : undefined,
    },
  };
}

export function buildBlogPostMetadata(post: PublicBlogPost): Metadata {
  return {
    title: post.title,
    description: post.metaDescription,
    alternates: {
      canonical: post.canonical,
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url: post.canonical,
      siteName: siteConfig.name,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      images: [
        {
          url: `${siteConfig.url}/assets/heroes/testing-home.avif`,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription,
      images: [`${siteConfig.url}/assets/heroes/testing-home.avif`],
    },
  };
}

export function buildBlogPostJsonLd(post: PublicBlogPost) {
  const base: {
    "@context": string;
    "@graph": Record<string, unknown>[];
  } = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${siteConfig.url}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: post.canonical,
          },
        ],
      },
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.metaDescription,
        datePublished: post.publishedAt ?? post.updatedAt,
        dateModified: post.updatedAt,
        mainEntityOfPage: post.canonical,
        url: post.canonical,
        author: {
          "@type": "Organization",
          name: siteConfig.name,
        },
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
        articleSection: post.category,
        keywords: [post.primaryKeyword, ...post.secondaryKeywords].filter(Boolean),
        about: post.heroFact.label,
      },
    ],
  };

  const faqItems = post.sections.flatMap((section) =>
    section.kind === "faq" && section.faqItems ? section.faqItems : [],
  );

  if (faqItems.length > 0) {
    base["@graph"].push({
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return base;
}

export function getBlogPostLastModified(post: PublicBlogPost | BlogPost) {
  return new Date(post.updatedAt);
}

export function getBlogEntryLastModified(entry: BlogIndexEntry) {
  return new Date(entry.updatedAt);
}

export function getBlogCanonicalPath(pathname: string) {
  return toAbsoluteUrl(pathname);
}
