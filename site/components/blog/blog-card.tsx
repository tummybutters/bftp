import { formatBlogDate } from "@/lib/blog/metadata";
import type { BlogIndexEntry } from "@/lib/blog/types";
import { TrackedLink } from "@/lib/analytics";

export function BlogCard({
  post,
  featured = false,
}: {
  post: BlogIndexEntry;
  featured?: boolean;
}) {
  return (
    <article
      className={featured ? "bftp-blog-card bftp-blog-card--featured" : "bftp-blog-card"}
    >
      <div className="bftp-blog-card__meta">
        <span className="badge-pill">{post.category}</span>
        {post.geography ? <span className="nav-chip">{post.geography}</span> : null}
      </div>
      <div className="bftp-blog-card__eyebrow">
        <span>{formatBlogDate(post.publishedAt)}</span>
        <span>{post.heroFact.value}</span>
      </div>
      <h2 className="bftp-blog-card__title">
        <TrackedLink
          href={post.path}
          event="blog_post_clicked"
          properties={{ title: post.title, featured }}
        >
          {post.title}
        </TrackedLink>
      </h2>
      <p className="bftp-blog-card__excerpt">{post.excerpt}</p>
      <p className="bftp-blog-card__audience">{post.audience}</p>
      <div className="bftp-blog-card__footer">
        <TrackedLink
          href={post.path}
          event="blog_read_more_clicked"
          properties={{ title: post.title, featured }}
          className="cta-button"
        >
          Read Article
        </TrackedLink>
      </div>
    </article>
  );
}
