# PostHog Analytics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Instrument the entire Backflow Test Pros website with PostHog analytics — pageviews, clicks, form submissions, scroll depth, section visibility — providing enough signal for an automated AI design optimization system.

**Architecture:** PostHog JS SDK loaded via a client-side provider component wrapping the app in `layout.tsx`. Automatic pageview capture via PostHog's built-in SPA tracking. Custom events fired from interactive components using a thin `useAnalytics` hook. Section visibility tracked via IntersectionObserver in a reusable `TrackedSection` wrapper. All events include page-level context (template family, path, title) so the AI system can correlate design patterns with engagement.

**Tech Stack:** `posthog-js` + `posthog-js/react`, Next.js 16 (App Router), React 19, TypeScript

---

## Event Taxonomy (for AI design optimization)

These are the events we'll track. Every event automatically gets PostHog's built-in properties ($current_url, $referrer, $device_type, $browser, $os, viewport, etc). We add custom properties on top.

### Automatic Events (PostHog built-in)
- `$pageview` — fires on every route change (SPA-aware)
- `$pageleave` — fires when user navigates away
- `$autocapture` — clicks, form submits, input changes (if enabled)

### Custom Events

| Event Name | When | Properties |
|---|---|---|
| `phone_cta_clicked` | Any tel: link tapped | `location` (header/hero/footer/mobile-menu), `phone_number` |
| `contact_cta_clicked` | Any contact link/button | `location`, `label` |
| `promo_banner_clicked` | Topbar promo link | `label` |
| `nav_link_clicked` | Primary nav link | `label`, `href`, `is_mobile` |
| `mobile_menu_toggled` | Hamburger open/close | `action` (open/close) |
| `hero_cta_clicked` | Hero primary action button | `label`, `href`, `is_phone` |
| `hero_read_more_toggled` | Details expand/collapse | `action` (open/close) |
| `faq_expanded` | FAQ accordion opened | `question`, `index` |
| `tab_selected` | Tab rail tab clicked | `tab_label`, `tab_index` |
| `cta_banner_clicked` | CTA banner button | `heading`, `label`, `href` |
| `pricing_cta_clicked` | Pricing band CTA | `label`, `href` |
| `pricing_callout_clicked` | Pricing callout link | `label`, `href` |
| `service_card_clicked` | Service card link | `label`, `href` |
| `link_grid_clicked` | Link grid item clicked | `label`, `href` |
| `footer_link_clicked` | Footer nav link | `label`, `href`, `column` |
| `footer_social_clicked` | Footer social icon | `platform` |
| `form_submitted` | Contact form submit | `form_action`, `field_count` |
| `form_field_focused` | User focuses a form field | `field_name`, `field_type` |
| `section_viewed` | Section enters viewport (50%+ visible for 1s) | `section_type`, `section_index`, `template_family` |
| `scroll_depth` | User reaches 25/50/75/90% | `depth_percent`, `max_depth_px` |

### Page-Level Properties (set as super properties / registered once per pageview)

Every custom event inherits these via PostHog's `register()`:

| Property | Value |
|---|---|
| `page_template` | Template family (e.g., `county_city_landing`, `core_service`) |
| `page_path` | URL path |
| `page_title` | Document title |
| `page_depth` | URL segment count (1 = top-level, 2 = county/city) |

---

## Task 1: Install posthog-js and create the provider

**Files:**
- Modify: `site/package.json` (add dependency)
- Create: `site/lib/analytics/posthog-provider.tsx`
- Create: `site/lib/analytics/index.ts`
- Modify: `site/app/layout.tsx` (wrap with provider)

**Step 1: Install posthog-js**

Run: `cd site && npm install posthog-js`

**Step 2: Create the PostHog provider**

Create `site/lib/analytics/posthog-provider.tsx`:

```tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname;
      const search = searchParams.toString();

      if (search) {
        url += "?" + search;
      }

      ph.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        capture_pageview: false, // we handle manually above
        capture_pageleave: true,
        autocapture: true,
        persistence: "localStorage+cookie",
      });
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
```

**Step 3: Create the analytics barrel export**

Create `site/lib/analytics/index.ts`:

```ts
export { PostHogProvider } from "./posthog-provider";
```

**Step 4: Wrap the app layout with the provider**

Modify `site/app/layout.tsx` — add import and wrap `{children}`:

```tsx
import type { Metadata } from "next";
import { Lato, PT_Sans } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/lib/analytics";

// ... fonts and metadata stay the same ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
```

**Step 5: Create `.env.local` with PostHog keys**

Create `site/.env.local`:

```
NEXT_PUBLIC_POSTHOG_KEY=<your-posthog-project-api-key>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Step 6: Verify build**

Run: `cd site && npm run build`
Expected: Build succeeds with no errors.

**Step 7: Commit**

```bash
git add site/lib/analytics/ site/app/layout.tsx site/package.json site/package-lock.json
git commit -m "feat(analytics): add PostHog provider and pageview tracking"
```

---

## Task 2: Add page-level context via super properties

**Files:**
- Create: `site/lib/analytics/use-page-context.ts`
- Modify: `site/components/templates/page-renderer.tsx`
- Create: `site/components/templates/page-context-registrar.tsx`

**Purpose:** Every event on a page should carry `page_template`, `page_path`, `page_title`, and `page_depth` so the AI system can group behavior by template family and page type.

**Step 1: Create the page context registrar**

Create `site/components/templates/page-context-registrar.tsx`:

```tsx
"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

interface PageContextProps {
  template: string;
  path: string;
  title: string;
}

export function PageContextRegistrar({ template, path, title }: PageContextProps) {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;

    posthog.register({
      page_template: template,
      page_path: path,
      page_title: title,
      page_depth: path.split("/").filter(Boolean).length,
    });

    return () => {
      posthog.unregister("page_template");
      posthog.unregister("page_path");
      posthog.unregister("page_title");
      posthog.unregister("page_depth");
    };
  }, [posthog, template, path, title]);

  return null;
}
```

**Step 2: Add the registrar to page-renderer**

Modify `site/components/templates/page-renderer.tsx`:

```tsx
import { SiteShell } from "@/components/chrome/site-shell";
import { PageContextRegistrar } from "@/components/templates/page-context-registrar";
import { loadPagePayloadByPath } from "@/lib/content/loaders";
import { getSiteCatalog } from "@/lib/content/site-index";
import { getTemplateDefinition } from "@/lib/templates/registry";
import type { PageEntry } from "@/lib/site-schema";

export async function PageRenderer({ page }: { page: PageEntry }) {
  const catalog = getSiteCatalog();
  const payload = await loadPagePayloadByPath(page.path);
  const definition = getTemplateDefinition(payload?.family ?? page.templateFamily);
  const Template = definition.component;

  return (
    <SiteShell>
      <PageContextRegistrar
        template={payload?.family ?? page.templateFamily}
        path={page.path}
        title={page.title}
      />
      <Template
        page={page}
        catalog={catalog}
        sectionOrder={definition.sectionOrder}
        templateLabel={definition.label}
        payload={payload}
      />
    </SiteShell>
  );
}
```

**Step 3: Verify build**

Run: `cd site && npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add site/components/templates/page-context-registrar.tsx site/components/templates/page-renderer.tsx
git commit -m "feat(analytics): register page-level super properties per route"
```

---

## Task 3: Instrument the site header (nav, phone, promo, mobile menu)

**Files:**
- Modify: `site/components/chrome/site-header.tsx`

**Step 1: Add tracking to site-header.tsx**

Import `usePostHog` (already a `"use client"` component) and add captures:

```tsx
// Add to imports:
import { usePostHog } from "posthog-js/react";

// Inside SiteHeader(), after existing hooks:
const posthog = usePostHog();
```

Then instrument each interaction — here are the specific changes:

**Promo banner link** (line ~68): Wrap with onClick
```tsx
<Link
  href="/contact-backflowtestpros"
  className="bftp-topbar__promo"
  onClick={() => posthog?.capture("promo_banner_clicked", { label: "Qualify for Free Backflow Repair Coverage" })}
>
```

**Phone link in topbar** (line ~81): Add onClick
```tsx
<a
  href="tel:18008036658"
  className="bftp-topbar__item"
  onClick={() => posthog?.capture("phone_cta_clicked", { location: "header-topbar", phone_number: "18008036658" })}
>
```

**Contact Us link in topbar** (line ~93): Add onClick
```tsx
<Link
  href="/contact-backflowtestpros"
  className="bftp-topbar__item"
  onClick={() => posthog?.capture("contact_cta_clicked", { location: "header-topbar", label: "Contact Us" })}
>
```

**Primary nav links** (line ~121): Add onClick to each link
```tsx
<Link
  key={link.href}
  href={link.href}
  className={...}
  onClick={() => posthog?.capture("nav_link_clicked", { label: link.label, href: link.href, is_mobile: false })}
>
```

**Phone CTA button in navbar** (line ~133): Add onClick
```tsx
<a
  href="tel:18008036658"
  className="bftp-navbar__cta bftp-cta-button"
  onClick={() => posthog?.capture("phone_cta_clicked", { location: "header-navbar", phone_number: "18008036658" })}
>
```

**Mobile menu toggle** (line ~153): Add capture to onClick handler
```tsx
onClick={() => {
  const willOpen = !mobileMenuOpen;
  posthog?.capture("mobile_menu_toggled", { action: willOpen ? "open" : "close" });
  setMobileMenuOpen(willOpen);
}}
```

**Mobile nav links** (line ~177): Add onClick
```tsx
onClick={() => {
  posthog?.capture("nav_link_clicked", { label: link.label, href: link.href, is_mobile: true });
  setMobileMenuOpen(false);
}}
```

**Mobile phone CTA** (line ~191): Add onClick
```tsx
<a
  href="tel:18008036658"
  className="bftp-navbar__mobile-phone bftp-cta-button"
  onClick={() => posthog?.capture("phone_cta_clicked", { location: "mobile-menu", phone_number: "18008036658" })}
>
```

**Mobile contact link** (line ~203): Add onClick
```tsx
onClick={() => {
  posthog?.capture("contact_cta_clicked", { location: "mobile-menu", label: "Contact Us" });
  setMobileMenuOpen(false);
}}
```

**Step 2: Verify build**

Run: `cd site && npm run build`

**Step 3: Commit**

```bash
git add site/components/chrome/site-header.tsx
git commit -m "feat(analytics): instrument header nav, phone CTAs, promo banner, mobile menu"
```

---

## Task 4: Instrument the hero section

**Files:**
- Modify: `site/components/sections/page-hero.tsx`

This component is currently a server component (no `"use client"` directive). The hero CTA is a plain `<Link>` or `<a>` — we need to make the tracking work without converting the whole thing to a client component.

**Approach:** Extract a small client-side `TrackedHeroCta` component inline or create a wrapper.

**Step 1: Create a tracked hero CTA component**

Create `site/components/sections/tracked-hero-cta.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";

export function TrackedHeroCta({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  const posthog = usePostHog();
  const isPhone = href.startsWith("tel:");

  const handleClick = () => {
    posthog?.capture(isPhone ? "phone_cta_clicked" : "hero_cta_clicked", {
      location: "hero",
      label,
      href,
      is_phone: isPhone,
    });
  };

  if (isPhone) {
    return (
      <a href={href} className={className} onClick={handleClick}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {label}
    </Link>
  );
}
```

**Step 2: Create a tracked "Read More" toggle**

Create `site/components/sections/tracked-hero-details.tsx`:

```tsx
"use client";

import { usePostHog } from "posthog-js/react";
import type { ReactNode } from "react";

export function TrackedHeroDetails({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const posthog = usePostHog();

  return (
    <details
      className={className}
      onToggle={(e) => {
        const open = (e.target as HTMLDetailsElement).open;
        posthog?.capture("hero_read_more_toggled", { action: open ? "open" : "close" });
      }}
    >
      {children}
    </details>
  );
}
```

**Step 3: Update page-hero.tsx to use tracked components**

Replace the `<a>` / `<Link>` in the hero actions with `<TrackedHeroCta>` and replace `<details>` with `<TrackedHeroDetails>`.

In the imports:
```tsx
import { TrackedHeroCta } from "@/components/sections/tracked-hero-cta";
import { TrackedHeroDetails } from "@/components/sections/tracked-hero-details";
```

Replace the primaryAction render block (lines ~183-195):
```tsx
{primaryAction ? (
  <div className="bftp-hero__actions">
    <TrackedHeroCta
      href={primaryAction.href}
      label={primaryAction.label}
      className={primaryActionClassName}
    />
  </div>
) : null}
```

Replace `<details className="bftp-hero__copy-details">` (line ~144):
```tsx
<TrackedHeroDetails className="bftp-hero__copy-details">
```
And close with `</TrackedHeroDetails>` instead of `</details>`.

**Step 4: Verify build**

Run: `cd site && npm run build`

**Step 5: Commit**

```bash
git add site/components/sections/tracked-hero-cta.tsx site/components/sections/tracked-hero-details.tsx site/components/sections/page-hero.tsx
git commit -m "feat(analytics): instrument hero CTA and read-more toggle"
```

---

## Task 5: Instrument the contact form

**Files:**
- Modify: `site/components/sections/contact-form.tsx`

**Step 1: Convert to client component and add tracking**

The form currently uses native form action/method. We'll add event tracking on submit and field focus while preserving the native form behavior.

Create a client wrapper: `site/components/sections/tracked-contact-form.tsx`:

```tsx
"use client";

import { usePostHog } from "posthog-js/react";
import type { ContactFormField } from "@/lib/content/types";

function renderField(
  field: ContactFormField,
  onFocus: (name: string, type: string) => void,
) {
  const fieldClasses =
    "w-full rounded-[1.2rem] border border-[color:rgba(31,45,78,0.14)] bg-white px-4 py-3 text-sm text-[color:var(--color-foreground)] shadow-[0_8px_24px_rgba(31,45,78,0.06)] outline-none transition focus:border-[color:var(--color-blue)]";

  if (field.fieldType === "textarea" || field.inputType === "textarea") {
    return (
      <textarea
        id={field.name}
        name={field.name}
        placeholder={field.placeholder}
        required={field.required}
        rows={6}
        className={`${fieldClasses} min-h-[10rem] resize-y`}
        onFocus={() => onFocus(field.name, "textarea")}
      />
    );
  }

  if (field.fieldType === "select") {
    return (
      <select
        id={field.name}
        name={field.name}
        required={field.required}
        defaultValue=""
        className={fieldClasses}
        onFocus={() => onFocus(field.name, "select")}
      >
        <option value="" disabled>
          {field.placeholder || field.label}
        </option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      id={field.name}
      name={field.name}
      type={field.inputType || "text"}
      placeholder={field.placeholder}
      required={field.required}
      className={fieldClasses}
      onFocus={() => onFocus(field.name, field.inputType || "text")}
    />
  );
}

export function TrackedContactForm({
  fields,
  submitLabel,
  formAction,
  formMethod,
}: {
  fields: ContactFormField[];
  submitLabel: string;
  formAction: string;
  formMethod: string;
}) {
  const posthog = usePostHog();

  const handleFocus = (fieldName: string, fieldType: string) => {
    posthog?.capture("form_field_focused", {
      field_name: fieldName,
      field_type: fieldType,
    });
  };

  const handleSubmit = () => {
    posthog?.capture("form_submitted", {
      form_action: formAction,
      field_count: fields.length,
    });
  };

  return (
    <form
      action={formAction || undefined}
      method={formMethod || "get"}
      className="grid gap-5 md:grid-cols-2"
      onSubmit={handleSubmit}
    >
      {fields.map((field) => (
        <label
          key={field.name}
          htmlFor={field.name}
          className={
            field.fieldType === "textarea"
              ? "space-y-2 md:col-span-2"
              : "space-y-2"
          }
        >
          <span className="text-sm font-semibold text-[color:var(--color-foreground)]">
            {field.label}
          </span>
          {renderField(field, handleFocus)}
        </label>
      ))}
      <div className="md:col-span-2">
        <button type="submit" className="bftp-cta-button">
          {submitLabel || "Send message"}
        </button>
      </div>
    </form>
  );
}
```

**Step 2: Update the original contact-form.tsx to re-export the tracked version**

Replace `site/components/sections/contact-form.tsx` contents:

```tsx
export { TrackedContactForm as ContactFormSection } from "./tracked-contact-form";
```

**Step 3: Verify build**

Run: `cd site && npm run build`

**Step 4: Commit**

```bash
git add site/components/sections/tracked-contact-form.tsx site/components/sections/contact-form.tsx
git commit -m "feat(analytics): instrument contact form submissions and field focus"
```

---

## Task 6: Instrument FAQ accordion

**Files:**
- Modify: `site/components/sections/faq-accordion.tsx`

**Step 1: Convert to client component with tracking**

The FAQ uses native `<details>` elements. We need `"use client"` to hook into `onToggle`.

Replace `site/components/sections/faq-accordion.tsx`:

```tsx
"use client";

import { usePostHog } from "posthog-js/react";
import type { FaqItem } from "@/lib/content/types";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const posthog = usePostHog();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[color:rgba(31,45,78,0.12)] bg-white shadow-[0_18px_48px_rgba(31,45,78,0.08)]">
      {items.map((item, index) => (
        <details
          key={`${item.question}-${index}`}
          className="group border-b border-[color:rgba(31,45,78,0.1)] last:border-b-0"
          onToggle={(e) => {
            if ((e.target as HTMLDetailsElement).open) {
              posthog?.capture("faq_expanded", {
                question: item.question,
                index,
              });
            }
          }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-left text-base font-bold text-[color:var(--color-foreground)]">
            <span>{item.question}</span>
            <span className="text-[color:var(--color-blue)] transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="px-6 pb-6 pt-0 text-sm leading-7 text-[color:var(--color-muted)]">
            {item.answer
              .replaceAll("\u200d", "\n")
              .split(/\n+/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph) => (
                <p key={paragraph} className="mt-3 first:mt-0">
                  {paragraph}
                </p>
              ))}
          </div>
        </details>
      ))}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd site && npm run build`

**Step 3: Commit**

```bash
git add site/components/sections/faq-accordion.tsx
git commit -m "feat(analytics): instrument FAQ accordion expansion tracking"
```

---

## Task 7: Instrument tab rail

**Files:**
- Modify: `site/components/sections/tab-rail.tsx`

This is already `"use client"`.

**Step 1: Add posthog tracking**

Add to imports:
```tsx
import { usePostHog } from "posthog-js/react";
```

Inside `TabRail`, after existing hooks:
```tsx
const posthog = usePostHog();
```

Update the tab button onClick (line ~92):
```tsx
onClick={() => {
  posthog?.capture("tab_selected", { tab_label: tab.label, tab_index: index });
  setActiveIndex(index);
}}
```

Update the CTA link (line ~150) — wrap with onClick:
```tsx
<Link
  href={ctaHref}
  className="bftp-cta-button"
  onClick={() => posthog?.capture("contact_cta_clicked", { location: "tab-rail", label: formatCtaLabel(ctaLabel) })}
>
```

**Step 2: Verify build**

Run: `cd site && npm run build`

**Step 3: Commit**

```bash
git add site/components/sections/tab-rail.tsx
git commit -m "feat(analytics): instrument tab rail selection and CTA tracking"
```

---

## Task 8: Instrument CTA banner, pricing band, service cards, link grid

**Files:**
- Modify: `site/components/sections/cta-banner.tsx`
- Modify: `site/components/sections/pricing-band.tsx`
- Modify: `site/components/sections/service-card-grid.tsx`
- Modify: `site/components/sections/link-grid.tsx`

These are all server components. For each, create a small client click-tracker wrapper rather than converting the whole component.

**Step 1: Create a generic tracked link component**

Create `site/lib/analytics/tracked-link.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";

interface TrackedLinkProps {
  href: string;
  event: string;
  properties?: Record<string, string | number | boolean>;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
  target?: string;
}

export function TrackedLink({
  href,
  event,
  properties,
  className,
  children,
  external,
  target,
}: TrackedLinkProps) {
  const posthog = usePostHog();

  const handleClick = () => {
    posthog?.capture(event, { href, ...properties });
  };

  if (external || href.startsWith("http") || href.startsWith("tel:")) {
    return (
      <a
        href={href}
        className={className}
        target={target || (external ? "_blank" : undefined)}
        rel={external ? "noreferrer" : undefined}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
```

**Step 2: Update cta-banner.tsx**

Add `"use client"` directive and use `usePostHog`:

```tsx
"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";

// ... interface stays same ...

export function CtaBanner({ heading, body, ctaLabel, ctaHref, backgroundSrc }: CtaBannerProps) {
  const posthog = usePostHog();

  // ... render stays same, but add onClick to Link:
  // <Link ... onClick={() => posthog?.capture("cta_banner_clicked", { heading, label: ctaLabel, href: ctaHref })}>
```

**Step 3: Update pricing-band.tsx**

Add `"use client"` and tracking for both the callout link and CTA button:

```tsx
"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";

// ... interface stays same ...

export function PricingBand({ items, calloutLabel, calloutHref, ctaLabel, ctaHref }: PricingBandProps) {
  const posthog = usePostHog();

  // Add onClick to callout Link:
  // onClick={() => posthog?.capture("pricing_callout_clicked", { label: calloutLabel, href: calloutHref })}

  // Add onClick to CTA Link:
  // onClick={() => posthog?.capture("pricing_cta_clicked", { label: ctaLabel, href: ctaHref })}
```

**Step 4: Update service-card-grid.tsx to use TrackedLink**

Replace the Link/a elements inside the card title with `TrackedLink`:

```tsx
import { TrackedLink } from "@/lib/analytics/tracked-link";

// Replace the title link:
<TrackedLink
  href={item.href}
  event="service_card_clicked"
  properties={{ label: item.label }}
  external={item.external}
  target={item.target}
>
  {item.label}
</TrackedLink>
```

**Step 5: Update link-grid.tsx to use TrackedLink**

```tsx
import { TrackedLink } from "@/lib/analytics/tracked-link";

// Replace each link in the grid:
<TrackedLink
  href={item.href}
  event="link_grid_clicked"
  properties={{ label: item.label }}
  external={item.external}
  target={item.target}
>
  {item.label}
</TrackedLink>
```

**Step 6: Verify build**

Run: `cd site && npm run build`

**Step 7: Commit**

```bash
git add site/lib/analytics/tracked-link.tsx site/components/sections/cta-banner.tsx site/components/sections/pricing-band.tsx site/components/sections/service-card-grid.tsx site/components/sections/link-grid.tsx
git commit -m "feat(analytics): instrument CTA banners, pricing, service cards, link grids"
```

---

## Task 9: Instrument the footer

**Files:**
- Modify: `site/components/chrome/site-footer.tsx`

**Step 1: Convert to client component and add tracking**

Add `"use client"` and `usePostHog`. Track footer nav links and social icons:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";

// ... constants stay same ...

export function SiteFooter() {
  const posthog = usePostHog();

  // Add onClick to page links:
  // onClick={() => posthog?.capture("footer_link_clicked", { label: page.label, href: page.href, column: "pages" })}

  // Add onClick to social icons:
  // onClick={() => posthog?.capture("footer_social_clicked", { platform: icon.alt })}
}
```

**Step 2: Verify build**

Run: `cd site && npm run build`

**Step 3: Commit**

```bash
git add site/components/chrome/site-footer.tsx
git commit -m "feat(analytics): instrument footer navigation and social links"
```

---

## Task 10: Add scroll depth tracking

**Files:**
- Create: `site/lib/analytics/use-scroll-depth.ts`
- Modify: `site/components/chrome/site-shell.tsx`

**Step 1: Create the scroll depth hook**

Create `site/lib/analytics/use-scroll-depth.ts`:

```ts
"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { usePathname } from "next/navigation";

const THRESHOLDS = [25, 50, 75, 90];

export function useScrollDepth() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const fired = useRef(new Set<number>());

  useEffect(() => {
    fired.current.clear();
  }, [pathname]);

  useEffect(() => {
    if (!posthog) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight <= 0) return;

      const percent = Math.round((scrollTop / docHeight) * 100);

      for (const threshold of THRESHOLDS) {
        if (percent >= threshold && !fired.current.has(threshold)) {
          fired.current.add(threshold);
          posthog.capture("scroll_depth", {
            depth_percent: threshold,
            max_depth_px: Math.round(scrollTop),
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [posthog, pathname]);
}
```

**Step 2: Create a client wrapper for SiteShell**

Create `site/components/chrome/scroll-depth-tracker.tsx`:

```tsx
"use client";

import { useScrollDepth } from "@/lib/analytics/use-scroll-depth";

export function ScrollDepthTracker() {
  useScrollDepth();
  return null;
}
```

**Step 3: Add to SiteShell**

Modify `site/components/chrome/site-shell.tsx`:

```tsx
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/chrome/site-footer";
import { SiteHeader } from "@/components/chrome/site-header";
import { ScrollDepthTracker } from "@/components/chrome/scroll-depth-tracker";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="bftp-page min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <ScrollDepthTracker />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
```

**Step 4: Verify build**

Run: `cd site && npm run build`

**Step 5: Commit**

```bash
git add site/lib/analytics/use-scroll-depth.ts site/components/chrome/scroll-depth-tracker.tsx site/components/chrome/site-shell.tsx
git commit -m "feat(analytics): add scroll depth tracking at 25/50/75/90% thresholds"
```

---

## Task 11: Add section visibility tracking

**Files:**
- Create: `site/lib/analytics/tracked-section.tsx`
- Modify: Each template file that renders sections

**Purpose:** The AI design system needs to know which sections users actually see and engage with. We track when a section is 50%+ visible for at least 1 second.

**Step 1: Create the TrackedSection component**

Create `site/lib/analytics/tracked-section.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";

interface TrackedSectionProps {
  sectionType: string;
  sectionIndex: number;
  children: React.ReactNode;
  className?: string;
}

export function TrackedSection({
  sectionType,
  sectionIndex,
  children,
  className,
}: TrackedSectionProps) {
  const posthog = usePostHog();
  const ref = useRef<HTMLDivElement>(null);
  const hasFired = useRef(false);

  useEffect(() => {
    hasFired.current = false;
  }, [sectionType, sectionIndex]);

  useEffect(() => {
    const el = ref.current;

    if (!el || !posthog) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasFired.current) {
          timer = setTimeout(() => {
            if (!hasFired.current) {
              hasFired.current = true;
              posthog.capture("section_viewed", {
                section_type: sectionType,
                section_index: sectionIndex,
              });
            }
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [posthog, sectionType, sectionIndex]);

  return (
    <div ref={ref} className={className} data-track-section={sectionType}>
      {children}
    </div>
  );
}
```

**Step 2: Identify where sections are rendered**

Look at the template components to find where section components are mapped. The `TrackedSection` wrapper should go around each section in the template render loop. This is template-specific — find the section iteration pattern in each template and wrap with `<TrackedSection>`.

For example, if a template maps sections like:
```tsx
{sectionOrder.map((sectionKey, index) => {
  const Section = sectionComponents[sectionKey];
  return <Section key={sectionKey} {...props} />;
})}
```

Wrap each:
```tsx
import { TrackedSection } from "@/lib/analytics/tracked-section";

{sectionOrder.map((sectionKey, index) => {
  const Section = sectionComponents[sectionKey];
  return (
    <TrackedSection key={sectionKey} sectionType={sectionKey} sectionIndex={index}>
      <Section {...props} />
    </TrackedSection>
  );
})}
```

**Note:** The exact implementation depends on how each template renders its sections. Check each template file in `site/components/templates/` and wrap the section render loop.

**Step 3: Verify build**

Run: `cd site && npm run build`

**Step 4: Commit**

```bash
git add site/lib/analytics/tracked-section.tsx site/components/templates/
git commit -m "feat(analytics): add section visibility tracking via IntersectionObserver"
```

---

## Task 12: Update analytics barrel export and final verification

**Files:**
- Modify: `site/lib/analytics/index.ts`

**Step 1: Update barrel export**

```ts
export { PostHogProvider } from "./posthog-provider";
export { TrackedLink } from "./tracked-link";
export { TrackedSection } from "./tracked-section";
export { useScrollDepth } from "./use-scroll-depth";
```

**Step 2: Full build verification**

Run: `cd site && npm run build`
Expected: Build succeeds, all 214 pages generated.

**Step 3: Dev server smoke test**

Run: `cd site && npm run dev`

Open browser, open DevTools Network tab, filter by `posthog`. Navigate a few pages and verify:
- `$pageview` events fire on each route change
- Clicking a nav link fires `nav_link_clicked`
- Clicking the phone number fires `phone_cta_clicked`
- Opening an FAQ fires `faq_expanded`
- Scrolling fires `scroll_depth` at 25%, 50%, etc.

**Step 4: Final commit**

```bash
git add site/lib/analytics/index.ts
git commit -m "feat(analytics): finalize barrel exports and verify full build"
```

---

## Summary: What the AI Design System Gets

After this instrumentation, PostHog will have:

1. **Traffic patterns** — pageviews by template family, path, referrer, device
2. **Engagement funnel** — scroll depth per page template tells you which layouts hold attention
3. **Section effectiveness** — `section_viewed` reveals which sections users actually see vs skip
4. **CTA performance** — every button/link click is tagged with location and label, enabling A/B comparison across templates
5. **Form friction** — field focus events show where users start but don't finish
6. **Navigation behavior** — which nav links get clicked, mobile vs desktop
7. **FAQ interest** — which questions users expand reveals content gaps
8. **Phone vs contact preference** — phone CTA vs contact form engagement ratio

All events carry `page_template` and `page_depth` as super properties, so the AI system can slice any metric by template family to compare design patterns.

### Not included (potential future additions)
- **Heatmaps** — PostHog has built-in toolbar heatmaps, no code needed (just enable in PostHog settings)
- **Session recordings** — toggle on in PostHog settings, zero code changes
- **Feature flags** — ready to use via `posthog.isFeatureEnabled()` when you want to A/B test design changes
- **User identification** — not needed for anonymous visitors; add `posthog.identify()` if/when auth is added
