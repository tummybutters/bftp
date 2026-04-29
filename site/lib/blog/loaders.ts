import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { BlogIndexEntry, BlogPost, PublicBlogPost, QueueRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "generated");

async function readJsonFile<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const fileContents = await readFile(filePath, "utf8");
  return JSON.parse(fileContents) as T;
}

function toPublicBlogPost(post: BlogPost): PublicBlogPost {
  const { sourceNotes: _sourceNotes, ...publicPost } = post;
  return publicPost;
}

export const loadBlogPosts = cache(function loadBlogPosts() {
  return readJsonFile<BlogPost[]>("blog-posts.json");
});

export const loadBlogQueue = cache(function loadBlogQueue() {
  return readJsonFile<QueueRecord[]>("blog-queue.json");
});

export const loadBlogIndex = cache(function loadBlogIndex() {
  return readJsonFile<BlogIndexEntry[]>("blog-index.json");
});

export const loadPublishedBlogPosts = cache(async function loadPublishedBlogPosts() {
  const posts = await loadBlogPosts();
  return posts
    .filter((post) => post.status === "Published")
    .map(toPublicBlogPost)
    .sort((left, right) => {
      const leftDate = new Date(left.publishedAt ?? left.updatedAt).getTime();
      const rightDate = new Date(right.publishedAt ?? right.updatedAt).getTime();
      return rightDate - leftDate;
    });
});

export const loadFeaturedBlogPost = cache(async function loadFeaturedBlogPost() {
  const posts = await loadPublishedBlogPosts();
  return posts[0];
});

export const loadPublishedBlogPostBySlug = cache(
  async function loadPublishedBlogPostBySlug(slug: string) {
    const posts = await loadPublishedBlogPosts();
    return posts.find((post) => post.slug === slug);
  },
);
