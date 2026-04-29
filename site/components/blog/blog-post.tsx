import { CtaBanner } from "@/components/sections/cta-banner";
import { PageHero } from "@/components/sections/page-hero";
import { SectionFrame } from "@/components/sections/section-frame";
import { PageContextRegistrar } from "@/components/templates/page-context-registrar";
import {
  buildBlogPostJsonLd,
  formatBlogDate,
  humanizeTemplateType,
  sanitizeJsonLd,
} from "@/lib/blog/metadata";
import type { BlogSection, PublicBlogPost } from "@/lib/blog/types";
import { TrackedLink } from "@/lib/analytics";

function renderSection(section: BlogSection) {
  if (section.kind === "faq" && section.faqItems?.length) {
    return (
      <div className="bftp-blog-faq">
        {section.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <div className="bftp-blog-faq__items">
          {section.faqItems.map((item) => (
            <article key={item.question} className="bftp-blog-faq__item">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bftp-reading">
      <div className="bftp-blog-section__copy">
        {section.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {section.statCallout ? (
        <aside className="bftp-blog-fact bftp-blog-fact--inline">
          <p className="bftp-blog-fact__label">{section.statCallout.label}</p>
          <p className="bftp-blog-fact__value">{section.statCallout.value}</p>
          <p className="bftp-blog-fact__context">{section.statCallout.context}</p>
        </aside>
      ) : null}
      {section.bullets?.length ? (
        <ul className="bftp-blog-checklist">
          {section.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function BlogPostArticle({ post }: { post: PublicBlogPost }) {
  const jsonLd = buildBlogPostJsonLd(post);

  return (
    <>
      <PageContextRegistrar template="blog_post" path={post.path} title={post.title} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(jsonLd) }}
      />

      <section className="bftp-band bftp-band--plain bftp-blog-breadcrumb-band">
        <div className="bftp-shell">
          <nav aria-label="Breadcrumb" className="bftp-blog-breadcrumbs">
            <TrackedLink href="/" event="blog_breadcrumb_clicked" properties={{ level: "home" }}>
              Home
            </TrackedLink>
            <span aria-hidden="true">/</span>
            <TrackedLink
              href="/blog"
              event="blog_breadcrumb_clicked"
              properties={{ level: "blog_hub" }}
            >
              Blog
            </TrackedLink>
            <span aria-hidden="true">/</span>
            <span>{post.title}</span>
          </nav>
        </div>
      </section>

      <PageHero
        eyebrow={post.category}
        title={post.title}
        subtitle={post.excerpt}
        bodyLines={[
          post.excerpt,
          `Updated ${formatBlogDate(post.updatedAt)}. Template: ${humanizeTemplateType(post.templateType)}.`,
        ]}
        promoText={`Primary keyword: ${post.primaryKeyword}`}
        badges={[
          post.heroFact.value,
          post.audience,
          post.geography || "Regional service context",
        ]}
        primaryAction={{
          href: post.cta.href,
          label: post.cta.label,
        }}
        styleVariant="editorial"
        heroVariant="navy"
      />

      <SectionFrame tone="surface" align="left" inset="reading">
        <div className="bftp-blog-post__intro">
          <aside className="bftp-blog-fact">
            <p className="bftp-blog-fact__label">{post.heroFact.label}</p>
            <p className="bftp-blog-fact__value">{post.heroFact.value}</p>
            <p className="bftp-blog-fact__context">{post.heroFact.context}</p>
          </aside>
          <div className="bftp-blog-takeaways">
            <p className="eyebrow">Key Takeaways</p>
            <ul>
              {post.keyTakeaways.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </SectionFrame>

      {post.sections.map((section, index) => (
        <SectionFrame
          key={section.id}
          id={section.id}
          tone={index % 2 === 0 ? "surface" : "band"}
          align="left"
          inset="reading"
          title={section.title}
        >
          {renderSection(section)}
        </SectionFrame>
      ))}

      <SectionFrame
        tone="navy"
        title="Related Service And Compliance Pages"
        body="These links are chosen from the existing service catalog so the article can hand readers off to the right next step without pretending the blog post itself is the service page."
      >
        <div className="bftp-blog-related">
          {post.internalLinks.map((item) => (
            <article key={item.href} className="bftp-blog-related__card">
              <h3>
                <TrackedLink
                  href={item.href}
                  event="blog_related_link_clicked"
                  properties={{ source_title: post.title, target_label: item.label }}
                >
                  {item.label}
                </TrackedLink>
              </h3>
              {item.description ? <p>{item.description}</p> : null}
            </article>
          ))}
        </div>
      </SectionFrame>

      <CtaBanner
        heading={post.cta.heading}
        body={post.cta.body}
        ctaLabel={post.cta.label}
        ctaHref={post.cta.href}
      />
    </>
  );
}
