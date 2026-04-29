import fs from "node:fs/promises";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data", "generated");
const postsPath = path.join(dataDir, "blog-posts.json");
const indexPath = path.join(dataDir, "blog-index.json");

const posts = JSON.parse(await fs.readFile(postsPath, "utf8"));

const index = posts
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

await fs.writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

console.log(`Wrote ${index.length} blog index entries to ${indexPath}`);
