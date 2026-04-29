import { BlogHub } from "@/components/blog/blog-hub";
import { buildBlogHubMetadata } from "@/lib/blog/metadata";
import { loadBlogIndex } from "@/lib/blog/loaders";

export async function generateMetadata() {
  const posts = await loadBlogIndex();
  return buildBlogHubMetadata(posts[0]);
}

export default async function BlogPage() {
  const posts = await loadBlogIndex();
  const featuredPost = posts[0];

  return <BlogHub featuredPost={featuredPost} posts={posts} />;
}
