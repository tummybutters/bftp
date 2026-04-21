# Backflow Test Pros Design Language

## Purpose

This document captures the design language we want to standardize across the current Backflow Test Pros site in `site/`.

It is informed by the stronger visual moments in the older concept project at:

- `/Users/tommybutcher/Projects/clients/backflow`

This is not a cloning brief. We are not porting that site wholesale. We are extracting the strongest recurring design ideas from it and applying them selectively to the current production build.

The goal is to make the current site feel more premium, more intentional, and more visually cohesive without changing approved copy, SEO wording, or the underlying content model.

## Core Direction

The site should feel like a premium field-services brand with editorial polish.

It should not feel:

- generic SaaS
- overdesigned luxury
- flat brochureware
- cluttered contractor marketing

It should feel:

- disciplined
- tactile
- trustworthy
- high-contrast
- photo-evidenced
- structured rather than busy

The visual identity should come from a small number of repeated ideas rather than a large number of one-off tricks.

## What We Are Borrowing

From the older concept project, the most successful reusable ideas are:

- velvety navy surfaces with subtle diagonal line texture
- warm off-white "paper" surfaces with the same faint texture
- gold used as trim, emphasis, framing, and primary CTA color
- photo treatments that feel like proof, not decoration
- cleaner credential and testimonial sections
- gold framing details such as inset borders and corner brackets
- stronger typography contrast between headings, accent lines, and micro-labels

## What We Are Not Borrowing

We are not directly porting:

- page layouts wholesale
- exact component compositions from the older project
- specific imagery, copy, logos, or proof points from the concept site
- the entire typography stack without judgment
- decorative framing on every single section

This site should feel evolved by those references, not rebuilt from them.

## Visual System

### 1. Color and Material Language

The site should revolve around four core materials:

- `navy`: structural base color for depth, contrast, and premium weight
- `deep navy`: darker support tone for overlays, bands, and footer/chrome moments
- `gold`: the only aggressive accent; used for CTA fill, dividers, icon color, highlight words, and framing
- `warm white`: a soft paper-toned background for editorial breathing room

Gold should not become a second body color. It should behave like trim and emphasis.

White should not be clinical. Light surfaces should feel warm and slightly textured.

### 2. Texture System

The diagonal line texture from the older concept is worth standardizing as a recurring brand surface.

We should support three main surface types:

- `navy-lined`
  - deep navy or navy gradient background
  - faint diagonal line texture
  - used for trust bands, testimonials, some CTA moments, and selected proof sections

- `paper-lined`
  - warm white background
  - very subtle diagonal line texture
  - used for editorial content, split sections, and lighter breathing sections

- `plain clean`
  - no texture
  - reserved for moments where the content itself needs maximum clarity

Important rule: the lined texture should be a recurring motif, not a blanket treatment. It works because it is subtle and selectively repeated.

Default page surfaces should stay mostly clean. The lined treatments should concentrate in dark proof bands, hero/chrome moments, and selected soft editorial bands rather than every section.

### 3. Typography Direction

The current site already has a stronger service-brand voice than the older concept. We should preserve that overall identity while borrowing some of the older project's contrast and elegance.

Typography should follow these rules:

- headlines should feel strong, decisive, and architectural
- accent lines or highlighted words can feel more editorial and expressive
- micro-labels, eyebrow text, badges, and CTA support text should use tracked uppercase styling
- body copy should remain highly readable and never feel fashion-oriented

The site should maintain one clear hierarchy:

- bold primary heading
- contrasting accent line or gold-highlighted emphasis where appropriate
- restrained body copy
- compact uppercase utility labels

If a serif is used, it should be used sparingly and intentionally, especially in testimonial quotes or secondary accent lines, not everywhere.

## Signature Section Patterns

### 1. Trust / Credential Sections

The old concept project's credential section is significantly stronger than the current generic card treatment.

Global direction:

- credentials should read as formal proof, not as ordinary feature cards
- large gold icons should sit on dark navy lined fields
- each item should have a small divider rule and compact uppercase label
- the section should feel ceremonial and clean

What to avoid:

- generic pale cards that feel interchangeable with any SaaS grid
- too much body copy under every credential item
- inconsistent icon styles within the same section

The rule here is clarity and authority. These sections should feel like trust signals, not content blocks.

### 2. Reviews / Testimonials

The testimonial treatment in the old concept project is a much better design benchmark than conventional boxed review cards.

Global direction:

- review sections should feel editorial and high-trust
- favor full-width navy or navy-photo-backed bands
- use a strong vertical gold rule instead of conventional card borders when possible
- use large, elegant quote styling
- keep attribution compact, uppercase, and gold

Testimonials should feel like highlighted proof pulled from the field, not customer-service widgets.

When a photo backdrop is not appropriate, a flat `navy-lined` background is the fallback.

### 3. Photo-Led Editorial Splits

The older concept handles image-and-copy split sections well, especially in the About teaser.

Global direction:

- use large framed photography to interrupt long runs of text
- treat photos as evidence of real work, crew, and site conditions
- apply consistent overlays or inset gold framing so images feel part of a system
- keep the copy side clean, restrained, and roomy

This is the right answer for sections that need visual relief without feeling like a random gallery insert.

### 4. CTA Surfaces

The current repo already has a stronger gold CTA button system. That should remain the primary CTA language.

What to borrow from the older concept:

- gold used as a bold, confident action surface
- cleaner framed CTA bands
- stronger separation between primary and secondary actions

What to preserve in the current site:

- the existing gold button as the primary action language
- navy as the supporting structure around it

Primary CTA rule:

- use filled gold for the main action
- use outlined or lighter treatments for secondary actions
- do not compete with the primary CTA using multiple loud buttons in the same area

### 5. Framing Details

The older concept uses framing well when it is restrained.

The most reusable framing ideas are:

- inset gold photo borders
- corner-bracket motifs
- slim divider rules
- gold edge accents on dark sections

These should be used as signature details, not constant decoration.

Best uses:

- hero
- testimonial sections
- photo-led split sections
- CTA banners
- selected pricing or proof modules

Avoid applying frames to every card on the page.

## Mapping to the Current Site

These design directions should map onto the current repo in a structured way.

### Global Surface and Texture Layer

Primary place to standardize this:

- `site/styles/tokens.css`
- `site/styles/patterns.css`

This is where the `navy-lined`, `paper-lined`, and related framing motifs should eventually live as reusable classes and tokens.

### Hero System

Primary place:

- `site/components/sections/page-hero.tsx`

Hero direction should stay aligned with the current site's stronger service voice, but it can adopt:

- better surface treatment
- cleaner left-aligned structure
- more disciplined accent usage
- more cohesive integration of background, headline, body, and CTA

### Credential Sections

Primary place:

- `site/components/sections/credential-grid.tsx`

This section should be redesigned away from pale generic cards and toward a more formal trust-band system.

### Review Sections

Primary place:

- `site/components/sections/review-grid.tsx`

This should move toward an editorial proof treatment rather than standard boxed review cards.

### Photo-Led Relief Sections

Primary places:

- `site/components/sections/in-the-field-strip.tsx`
- other future split-image sections

The current field strip can evolve into a more intentional photo-led evidence system with better framing, titles, and placement rhythm.

### CTA and Promo Bands

Primary places:

- `site/components/sections/content-section-renderer.tsx`
- CTA-related section components and shared button styles

These should eventually use a more standardized band language rather than feeling page-specific.

## Rollout Priorities

When implementing this design language, the order should be:

1. Standardize background surfaces and texture classes
2. Upgrade credential/trust sections
3. Upgrade testimonial/review sections
4. Upgrade photo-led split sections and field-photo bands
5. Standardize framed CTA bands and promo surfaces
6. Refine secondary section types after the main visual language is stable

This order matters because the site will feel more cohesive faster if the repeated, global sections improve first.

## Guardrails

To keep the site from drifting into a messy hybrid, we should follow these rules:

- do not texture every section
- do not introduce multiple icon styles in the same content family
- do not use gold as a general-purpose text color
- do not turn every proof section into a photo background section
- do not add decorative frames everywhere
- do not let editorial styling reduce readability
- do not change approved copy just to fit a layout

## Practical Standard

Every page should feel like it was built from the same handful of materials:

- navy structure
- warm white relief
- gold emphasis
- subtle line texture
- real field photography
- restrained premium framing

If a section cannot be described using those materials, it probably does not belong in the system yet.

## Reference Files

Key concept references reviewed for this document:

- `/Users/tommybutcher/Projects/clients/backflow/src/app/globals.css`
- `/Users/tommybutcher/Projects/clients/backflow/src/components/TrustBadges.tsx`
- `/Users/tommybutcher/Projects/clients/backflow/src/components/Testimonials.tsx`
- `/Users/tommybutcher/Projects/clients/backflow/src/components/AboutTeaser.tsx`
- `/Users/tommybutcher/Projects/clients/backflow/src/components/Hero.tsx`
- `/Users/tommybutcher/Projects/clients/backflow/src/components/CTABanner.tsx`
