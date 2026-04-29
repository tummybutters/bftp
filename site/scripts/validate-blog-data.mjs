import fs from "node:fs/promises";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data", "generated");

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function gatherBodyText(post) {
  return post.sections
    .flatMap((section) => [
      section.title,
      ...(section.body ?? []),
      ...((section.bullets ?? []).map((item) => item)),
      ...((section.faqItems ?? []).flatMap((item) => [item.question, item.answer])),
    ])
    .filter(Boolean)
    .join(" ");
}

function deriveIndex(posts) {
  return posts
    .filter((post) => post.status === "Published" && post.publishedAt)
    .map((post) => ({
      slug: post.slug,
      path: post.path,
      canonical: post.canonical,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      audience: post.audience,
      geography: post.geography,
      templateType: post.templateType,
      primaryKeyword: post.primaryKeyword,
      heroFact: post.heroFact,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      status: "Published",
    }))
    .sort((left, right) => {
      const leftDate = new Date(left.publishedAt ?? left.updatedAt).getTime();
      const rightDate = new Date(right.publishedAt ?? right.updatedAt).getTime();
      return rightDate - leftDate;
    });
}

const [posts, index, queue, pageLookup] = await Promise.all([
  fs.readFile(path.join(dataDir, "blog-posts.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(dataDir, "blog-index.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(dataDir, "blog-queue.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(dataDir, "page-lookup.json"), "utf8").then(JSON.parse),
]);

const errors = [];

const validStatuses = new Set([
  "Queued",
  "Drafting",
  "Drafted",
  "Review Required",
  "Approved",
  "Scheduled",
  "Published",
  "Error",
]);

const validTemplateTypes = new Set([
  "stat_explainer",
  "compliance_article",
  "cost_risk_article",
  "localized_service_article",
  "commercial_facility_article",
  "refresh_update_article",
]);

const existingSiteSlugs = new Set(
  Object.values(pageLookup.pagesByPath).map((page) => page.path.replace(/^\//, "")),
);
const existingSiteTitles = new Set(
  Object.values(pageLookup.pagesByPath).map((page) => normalize(page.title)),
);

const postSlugs = new Set();
const postTitles = new Set();

for (const post of posts) {
  if (!validStatuses.has(post.status)) {
    errors.push(`Invalid post status for ${post.slug}: ${post.status}`);
  }

  if (!validTemplateTypes.has(post.templateType)) {
    errors.push(`Invalid template type for ${post.slug}: ${post.templateType}`);
  }

  if (!post.heroFact?.value || !post.heroFact?.label) {
    errors.push(`Missing hero fact for ${post.slug}`);
  }

  if (!Array.isArray(post.sourceNotes) || post.sourceNotes.length === 0) {
    errors.push(`Missing source notes for ${post.slug}`);
  }

  if (!post.cta?.label || !post.cta?.href) {
    errors.push(`Missing CTA for ${post.slug}`);
  }

  if (!Array.isArray(post.internalLinks) || post.internalLinks.length === 0) {
    errors.push(`Missing internal links for ${post.slug}`);
  }

  if (!Array.isArray(post.sections) || post.sections.length === 0) {
    errors.push(`Missing article sections for ${post.slug}`);
  }

  const bodyText = gatherBodyText(post);
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  if (post.status === "Published" && wordCount < 320) {
    errors.push(`Published post is too short for ${post.slug}: ${wordCount} words`);
  }

  if (/todo|tbd|\[\s*insert/i.test(bodyText)) {
    errors.push(`Placeholder copy found in ${post.slug}`);
  }

  if (post.status === "Published" && (!post.publishedAt || !post.updatedAt)) {
    errors.push(`Published post missing dates for ${post.slug}`);
  }

  if (post.status === "Published" && post.templateType === "refresh_update_article") {
    errors.push(`Refresh/update article cannot be published without separate verification: ${post.slug}`);
  }

  if (post.geography && post.geography !== "United States" && post.status === "Published") {
    const geographyMentioned =
      normalize(post.title).includes(normalize(post.geography)) ||
      normalize(post.excerpt).includes(normalize(post.geography)) ||
      normalize(bodyText).includes(normalize(post.geography));

    if (!geographyMentioned) {
      errors.push(`Localized post body does not support geography for ${post.slug}`);
    }
  }

  if (postSlugs.has(post.slug)) {
    errors.push(`Duplicate blog slug: ${post.slug}`);
  }
  postSlugs.add(post.slug);

  if (postTitles.has(normalize(post.title))) {
    errors.push(`Duplicate blog title: ${post.title}`);
  }
  postTitles.add(normalize(post.title));

  if (existingSiteSlugs.has(post.slug)) {
    errors.push(`Blog slug conflicts with existing site path: ${post.slug}`);
  }

  if (existingSiteTitles.has(normalize(post.title))) {
    errors.push(`Blog title conflicts with existing site title: ${post.title}`);
  }

  if (slugify(post.title) !== post.slug) {
    errors.push(`Slug does not match title slugification for ${post.slug}`);
  }
}

const derivedIndex = deriveIndex(posts);
if (JSON.stringify(derivedIndex) !== JSON.stringify(index)) {
  errors.push("blog-index.json is out of sync with blog-posts.json");
}

for (const entry of index) {
  if ("sourceNotes" in entry) {
    errors.push(`blog-index.json leaked source notes for ${entry.slug}`);
  }
}

const queueIds = new Set();
const queueSlugs = new Set();
for (const record of queue) {
  if (!record.id || queueIds.has(record.id)) {
    errors.push(`Queue record id is missing or duplicated: ${record.id}`);
  }
  queueIds.add(record.id);

  if (!record.articleTitle || !record.slug) {
    errors.push(`Queue record missing title or slug: ${record.id}`);
  }

  if (!validStatuses.has(record.status)) {
    errors.push(`Queue record has invalid status: ${record.id} -> ${record.status}`);
  }

  if (!validTemplateTypes.has(record.templateType)) {
    errors.push(`Queue record has invalid template type: ${record.id} -> ${record.templateType}`);
  }

  if (!Array.isArray(record.sourceStats) || record.sourceStats.length === 0) {
    errors.push(`Queue record missing source stats: ${record.id}`);
  }

  if (queueSlugs.has(record.slug)) {
    errors.push(`Duplicate queue slug: ${record.slug}`);
  }
  queueSlugs.add(record.slug);
}

if (errors.length > 0) {
  console.error("Blog data validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Blog data validation passed for ${posts.length} posts, ${index.length} index entries, and ${queue.length} queue records.`,
);
