# Backflow Test Pros Website Canonical Checklist

Updated: 2026-04-22

Intent source: `Tommy x JJ, Website & More - Transcript`

Current-status source: repo verification in `/Users/tommybutcher/Documents/backflowpro/site`

## Ground Rules

- Keep OG wording and overall page structure whenever the generated payload already contains that copy.
- Do not redesign when a fidelity-first pass will do.
- Hero background photos do not need exact 1:1 fidelity as long as the overall OG feel, wording, and layout are right.
- When transcript intent and current repo status differ:
  - The transcript defines the target.
  - The repo defines what is actually done today.

## Done

### Header / Nav

- `Blog` has been removed from the primary navigation.
- `Service Areas` has been added to the primary navigation.
- The header/nav has been pushed back toward the OG structure:
  - dark promo strip on top
  - white nav bar below
  - logo left
  - text nav right

### Service Areas Architecture

- A dedicated `Service Areas` page exists.
- The service-area hub is county-first, then drills down to city pages.
- The active county set matches the transcript direction:
  - Orange County
  - Los Angeles County
  - Ventura County
  - San Diego County
  - Riverside County
  - San Bernardino County
- Santa Barbara was mentioned as optional in the call and is not required.

### Footer Basic Page Linking

- The footer `Pages` column is wired to real routes.
- The footer regulation column is now wired to the existing regulation pages:
  - `/orange-county-water-district-backflow-regulations`
  - `/los-angeles-county-water-district-backflow-regulations`

### Main OG Hero Direction

- The shared hero path has been pushed back to the OG centered overlay style for the main site pages.
- The hero copy is using the OG wording already stored in the generated payloads.
- The naked phone number has been replaced with a real CTA button.
- Testing/install hero promo lines are being split back out as highlighted gold callout copy instead of being buried as normal white paragraph text.

### Pricing / Diamonds

- Shared pricing sections now use the diamond treatment.
- No diamond is blue by default.
- Hover/focus highlights the hovered item.
- Clicking a diamond routes to the contact page with prefilled intent/topic details.

### Benefits / Credential Strip

- The broken OG-style benefits/credentials strip has been replaced by a dedicated shared implementation via `ProofMarquee`.

### Page-Length / SEO Cleanup

- The repeated bottom service-area keyword blocks have been removed from:
  - Home
  - Backflow Testing
  - Backflow Repair
  - Backflow Installation
- The about-page unverified review/testimonial section has been removed.
- Irrigation and swimming pool pages exist and are buried from the main nav/footer, which matches transcript intent.

### Buttons / Visual Cleanup

- Neon/glow treatment has been removed from the shared CTA button styling.
- Crosshatch / lined textures are no longer actively applied in the shared site surfaces currently in use.
  - Note: the old CSS helper classes still exist in the stylesheet, but they are not currently wired into the shared chrome/components I verified.

### Contact Page Basics

- The visible public contact email has been added to the contact page.
- Current published address:
  - `contactus@teambackflowpros.team`

### Closed / No Current Evidence Of Remaining Issue

- The transcript mentioned removing an `onsite` item on the testing page.
- Current repo search did not show an active `onsite` / `on-site` section in the generated content or shared render path that I checked.
- Treat this as resolved unless a fresh screenshot shows it still exists in the live rendered page.

## Not Done Yet

### Footer Local Water Authority Links

- The `California Local Water Authorities` footer column still renders plain text.
- Those entries do not yet point to the real authority pages.

### Footer Social Links

- The footer social icons are visually present.
- They still route to the contact page instead of the real social destinations.

### CTA Banner Fidelity

- The shared CTA banners still need the OG blurry-banner treatment.
- They are functional, but not yet visually matched to the original style described in the call.

### Remaining Page-By-Page Section Fidelity

- The hero/nav/pricing passes have been pushed much closer to the OG direction.
- The rest of the page sections are not yet a fully completed 1:1 fidelity pass across:
  - About
  - Backflow Testing
  - Backflow Repair
  - Backflow Installation
- This mostly means shared section styling and banner/presentation touch-ups, not rebuilding the information architecture from scratch.

## Waiting On Client

- Real footer local water authority URLs.
- Real footer social URLs.
- Updated field / crew / installation photos from Cindy.
- Any final confirmation that `contactus@teambackflowpros.team` is still the exact public-facing email to publish.

## Later / Separate Phase

### Better Contact Intake

- The transcript direction was:
  - do not default to a chatbot
  - build a smoother quiz-style intake/contact flow instead
- That flowchart/tree has not been defined yet.
- This is a later UX / form-logic phase, not part of the current visual touch-up pass.

### Launch / Indexing Handoff

- The transcript treated final production connection / indexing as a separate handoff after the touch-ups are complete.
- Do not treat launch/indexing as complete just because the design pass is moving forward.

## Out Of Scope For This Checklist

- The report agent / PDF / portal automation discussion near the end of the call.
- Any agentmail / email automation internals beyond the visible website contact experience.

## Authoritative Repo Files For This Checklist

- `site/lib/site-config.ts`
- `site/components/chrome/site-header.tsx`
- `site/components/chrome/site-footer.tsx`
- `site/components/sections/page-hero.tsx`
- `site/components/sections/content-section-renderer.tsx`
- `site/components/sections/pricing-band.tsx`
- `site/components/sections/proof-marquee.tsx`
- `site/components/sections/tracked-contact-form.tsx`
- `site/components/templates/structured-page-template.tsx`
- `site/components/templates/service-area-hub-template.tsx`
