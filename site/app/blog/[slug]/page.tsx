import { notFound } from "next/navigation";

import { BlogPostArticle } from "@/components/blog/blog-post";
import { buildBlogPostMetadata } from "@/lib/blog/metadata";
import {
  loadPublishedBlogPostBySlug,
  loadPublishedBlogPosts,
} from "@/lib/blog/loaders";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await loadPublishedBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await loadPublishedBlogPostBySlug(slug);

  return post ? buildBlogPostMetadata(post) : undefined;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await loadPublishedBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <BlogPostArticle post={post} />;
}
