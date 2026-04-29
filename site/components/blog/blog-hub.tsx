import { BlogCard } from "@/components/blog/blog-card";
import { CtaBanner } from "@/components/sections/cta-banner";
import { PageHero } from "@/components/sections/page-hero";
import { SectionFrame } from "@/components/sections/section-frame";
import { PageContextRegistrar } from "@/components/templates/page-context-registrar";
import { siteConfig } from "@/lib/site-config";
import type { BlogIndexEntry } from "@/lib/blog/types";

export function BlogHub({
  featuredPost,
  posts,
}: {
  featuredPost?: BlogIndexEntry;
  posts: BlogIndexEntry[];
}) {
  const supportingPosts = featuredPost
    ? posts.filter((post) => post.slug !== featuredPost.slug)
    : posts;

  return (
    <>
      <PageContextRegistrar
        template="blog_hub"
        path="/blog"
        title="Blog"
      />
      <PageHero
        eyebrow="Workbook-Backed Blog"
        title="Source-Backed Backflow And Plumbing Guidance"
        subtitle="A dedicated editorial hub for fact-grounded posts that explain risk, compliance, water waste, and facility operations in plain English."
        bodyLines={[
          "This section is separate from the clone-style service page catalog on purpose.",
          "Each article stays self-canonical, cites approved workbook facts internally, and links readers back into the right service, regulation, and service-area pages when the topic calls for action.",
        ]}
        badges={[
          "Dedicated /blog architecture",
          "Conservative content rules",
          "Southern California service context",
        ]}
        primaryAction={{
          href: siteConfig.contactPath,
          label: "Request Service",
        }}
        styleVariant="editorial"
        heroVariant="photo"
        heroImageSrc="/assets/heroes/testing-home.avif"
      />

      {featuredPost ? (
        <SectionFrame
          tone="surface"
          title="Featured Article"
          body="The latest published article leads the hub and sets the editorial tone for future automated drafts."
        >
          <BlogCard post={featuredPost} featured />
        </SectionFrame>
      ) : null}

      <SectionFrame
        tone="band"
        title="Latest Articles"
        body="Published posts stay lightweight on the hub and open into full article pages with fact callouts, related service links, and a service-ready CTA."
      >
        {supportingPosts.length > 0 ? (
          <div className="bftp-blog-grid">
            {supportingPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : featuredPost ? null : (
          <div className="bftp-blog-empty">
            No published posts are available yet. Seed blog data exists in
            `site/data/generated/blog-posts.json`, and the conservative agent brief
            explains how future drafts should be promoted into this public index.
          </div>
        )}
      </SectionFrame>

      <CtaBanner
        heading="Need Backflow Testing, Repair, Or A Compliance Review?"
        body="The blog explains the why. Our service team handles the testing, repair, reporting, and coordination that actually move a property back into a safer, documented state."
        ctaLabel="Contact Backflow Test Pros"
        ctaHref={siteConfig.contactPath}
      />
    </>
  );
}
