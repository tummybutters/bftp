# Round 2 Handoff

This document is the shared reset point for the second agent round.

## Current Snapshot

- Agent 1 left a working Next.js App Router scaffold in `/Users/tommybutcher/Documents/backflowpro/site`.
- `npm run lint` passes.
- `npm run build` passes.
- The app statically generates `216` routes from the current route system.
- Agent 2 generated structured payloads for `206` modeled pages:
  - `11` core service pages
  - `172` county/city landing pages
  - `7` service-area hubs
  - `16` commercial vertical pages
- Agent 2 also logged `32` content anomalies and preserved known live defects on purpose.
- Agent 3 created the first visual system and organized `54` captured assets into `site/public/assets`.

## What Round 1 Solved

- route and template family foundation
- initial design tokens and asset wiring
- typed content generation for the major page families
- stable status docs and anomaly tracking

## What Still Needs To Happen

Round 2 is the transition from scaffold to representative clone.

The biggest remaining gaps are:

- templates still lean on heading-derived placeholder copy in several sections instead of structured page payloads
- `7` live pages still sit outside the generated content model:
  - `/`
  - `/about-us`
  - `/contact-backflowtestpros`
  - `/los-angeles-county-backflow-testing-repair`
  - `/los-angeles-county-water-district-backflow-regulations`
  - `/orange-county-water-district-backflow-regulations`
  - `/privacy-policy`
- visual fidelity is still short on:
  - exact hero treatments
  - pricing polygon treatment
  - compliance tab density
  - map embedding/treatment
  - logo belt / proof strip behavior
- long-tail locality drift is only partially audited across the city corpus

## Round 2 Success Criteria

By the end of round 2, the workspace should have:

- page templates rendering real structured payload data instead of mostly heading-based placeholders
- all major section types wired into the app:
  - hero
  - logo strip
  - feature cards
  - pricing tiles
  - CTA banner
  - tabbed content
  - bullet columns
  - link list
  - FAQ accordion
  - rich text
- the `7` omitted live pages modeled or intentionally special-cased in code
- representative visual parity across at least:
  - home
  - one core service page
  - one county/city landing page
  - one service-area hub
  - one commercial vertical page
- updated status docs that clearly say what remains for round 3

## Ownership Boundaries For Round 2

### Agent 1

Own integration and rendering:

- `/Users/tommybutcher/Documents/backflowpro/site/app/`
- `/Users/tommybutcher/Documents/backflowpro/site/components/templates/`
- `/Users/tommybutcher/Documents/backflowpro/site/components/sections/`
- `/Users/tommybutcher/Documents/backflowpro/site/lib/templates/`
- `/Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-1-status.md`

Avoid generating or editing page datasets unless blocked.

### Agent 2

Own content completeness and payload fidelity:

- `/Users/tommybutcher/Documents/backflowpro/site/data/`
- `/Users/tommybutcher/Documents/backflowpro/site/content/`
- `/Users/tommybutcher/Documents/backflowpro/site/lib/content/`
- `/Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-2-status.md`
- `/Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/content-anomalies.md`

Avoid touching React template files unless absolutely necessary.

### Agent 3

Own section-level fidelity and visual QA:

- `/Users/tommybutcher/Documents/backflowpro/site/public/`
- `/Users/tommybutcher/Documents/backflowpro/site/styles/`
- `/Users/tommybutcher/Documents/backflowpro/site/lib/design/`
- `/Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-3-status.md`
- `/Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/visual-qa-notes.md`

Only touch shared React components when needed to land styling or fidelity-critical presentation.

## Priority Order

If you stagger launch times, use this order:

1. Agent 2
2. Agent 3
3. Agent 1

If all three run at once, that is still fine. Agent 1 should treat Agent 2 and Agent 3 outputs as landing during the round and keep the renderer flexible.

## Representative Pages To Use For Fidelity

- `/`
- `/backflow-installation`
- `/orange-county/irvine-backflow-testing-repair`
- `/orange-county-backflow-testing-installation-repair-service-areas`
- `/commercial-backflow-testing-installation-repair`

## Known High-Signal Defects To Preserve

- Rancho Santa Margarita page drifts into Carlsbad neighborhoods
- Mission Viejo page injects Tustin regulation copy
- Alhambra page includes `Intallation`
- multiple FAQ/core-service typos such as `differnt` and `installationn`
- regulation pages preserve `Regualatory`

Do not silently fix these unless explicitly told to.
