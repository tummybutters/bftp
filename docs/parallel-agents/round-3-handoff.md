# Round 3 Handoff

This document is the shared reset point for the third agent round.

## Current Snapshot

- All `213` live public pages are now modeled in generated payloads.
- The app renders from payload-driven sections rather than mostly inventory/heading fallbacks.
- Generic live pages are now modeled too:
  - `/`
  - `/about-us`
  - `/contact-backflowtestpros`
  - `/los-angeles-county-backflow-testing-repair`
  - `/los-angeles-county-water-district-backflow-regulations`
  - `/orange-county-water-district-backflow-regulations`
  - `/privacy-policy`
- `npm run lint` passes in `/Users/tommybutcher/Documents/backflowpro/site`
- `npm run build` passes in `/Users/tommybutcher/Documents/backflowpro/site`
- Current static output is `216` routes.

## What Round 2 Solved

- full live-page payload coverage
- canonical page lookup keyed by path
- payload-first template rendering
- representative family-level visual parity
- better section rendering support across the main content kinds

## What Still Actually Matters

Round 3 should not build more foundation. It should push the clone toward release-candidate fidelity.

The remaining high-value gaps are:

- subtle locality drift still needs manual review on borderline pages
- some payloads are denser than the live screenshots, especially:
  - commercial verticals
  - regulation pages
  - some city landing long-form sections
- exact visual fidelity is still short on:
  - home hero framing
  - installation hero framing
  - pricing polygon texture/art treatment
  - logo belt order/behavior
  - map flatness/treatment
  - compliance tab density
- archived-only decisions still need route-level implementation where appropriate:
  - `/annual-backflow-testing` -> `/backflow-testing`
  - `/contact-us` -> `/contact-backflowtestpros`

## Round 3 Goal

Leave the workspace with a release-candidate clone that is materially closer to the live site in behavior, density, and visual fingerprint.

## Priority Themes

### 1. Content Trustworthiness

Round 3 content work should focus on:

- manual review of the remaining borderline locality-drift pages
- density tuning where generated payloads overstate the live page
- representative-page exactness over broad new automation

### 2. Visual Fingerprint

Round 3 visual work should focus on:

- hero framing and line-break control
- pricing polygon treatment
- proof/logo belt ordering and motion
- flattening or simplifying the map treatment where the current UI is too card-like
- closer section spacing and footer density

### 3. Release-Candidate Integration

Round 3 integration should focus on:

- archived redirects
- final section ordering sanity
- tabs/accordions/marquee/form behavior
- representative-page QA readiness

## Representative Pages For Round 3

Use these pages as the main fidelity targets:

- `/`
- `/backflow-installation`
- `/orange-county/irvine-backflow-testing-repair`
- `/orange-county-backflow-testing-installation-repair-service-areas`
- `/commercial-backflow-specialists/restaurant-food-services-backflow-testing-installation-repair-services`
- `/los-angeles-county-water-district-backflow-regulations`
- `/orange-county-water-district-backflow-regulations`

## High-Signal Content Risk Pages

Use these pages for manual content review before trying to normalize anything:

- `/orange-county/rancho-santa-margarita-backflow-testing-installation-repair`
- `/orange-county/mission-viejo-backflow-testing-repair`
- `/la-county/hollywood-backflow-testing-repair`
- both regulation pages
- one or two denser commercial verticals

## Ownership Boundaries For Round 3

### Agent 2

Own manual audit and payload refinement:

- `/Users/tommybutcher/Documents/backflowpro/site/data/`
- `/Users/tommybutcher/Documents/backflowpro/site/content/`
- `/Users/tommybutcher/Documents/backflowpro/site/lib/content/`
- `/Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-2-status.md`
- `/Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/content-anomalies.md`

### Agent 3

Own exact module polish and screenshot fidelity:

- `/Users/tommybutcher/Documents/backflowpro/site/public/`
- `/Users/tommybutcher/Documents/backflowpro/site/styles/`
- `/Users/tommybutcher/Documents/backflowpro/site/lib/design/`
- `/Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-3-status.md`
- `/Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/visual-qa-notes.md`

### Agent 1

Own final integration and route behavior:

- `/Users/tommybutcher/Documents/backflowpro/site/app/`
- `/Users/tommybutcher/Documents/backflowpro/site/components/`
- `/Users/tommybutcher/Documents/backflowpro/site/lib/templates/`
- `/Users/tommybutcher/Documents/backflowpro/site/lib/content/loaders.ts`
- `/Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-1-status.md`

## Recommended Launch Order

1. Agent 2
2. Agent 3
3. Agent 1

That keeps Agent 1 as the integrator after content and visual deltas land.

## Guardrails

- Do not “improve” the site into a different design system.
- Do not silently fix known live defects that are intentionally preserved.
- Prefer manual overrides and targeted review over broad new parsing logic unless a pattern is very clear.
- Round 3 should reduce uncertainty, not create more abstraction for its own sake.
