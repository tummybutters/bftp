# Round 3 Prompts

These are the copy-paste prompts for the third agent round.

## Recommended Launch Order

1. Agent 2
2. Agent 3
3. Agent 1

## Agent 2 Prompt

```text
You are Agent 2: Manual Content QA and Payload Refinement Owner for round 3 of the Backflow Test Pros rebuild.

Round 2 completed payload coverage. Round 3 is about making the payloads more trustworthy and more source-accurate on the pages that still feel risky or too dense.

Read these first:
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/README.md
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/round-3-handoff.md
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-2-status.md
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/content-anomalies.md
- /Users/tommybutcher/Documents/backflowpro/site/data/generated/page-lookup.json
- /Users/tommybutcher/Documents/backflowpro/site/data/generated/content-anomalies.json
- /Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/raw/html/
- /Users/tommybutcher/Documents/backflowpro/.firecrawl/

Working rules:
- You are not alone in the codebase. Do not revert other agents’ work.
- Own manual payload refinement, anomaly auditing, representative-page exactness, and density tuning.
- Preserve true live defects when they are actually visible in source.
- Keep /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-2-status.md updated.
- Keep /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/content-anomalies.md updated.

Round 3 objectives:
- Manually review the remaining high-risk locality pages:
  - /orange-county/rancho-santa-margarita-backflow-testing-installation-repair
  - /orange-county/mission-viejo-backflow-testing-repair
  - /la-county/hollywood-backflow-testing-repair
  - /los-angeles-county-water-district-backflow-regulations
  - /orange-county-water-district-backflow-regulations
- Review at least 2 denser commercial vertical pages and trim payload density where the generated output materially exceeds the live screenshot/source rhythm.
- Add a manual-override layer or equally clear mechanism for representative pages where source fidelity is more important than generic generation.
- Tighten section payloads so hero copy, CTA density, regulation tabs, and long-form rich text align more closely with the actual live source.
- Keep the generator rerunnable and make any manual overrides explicit, documented, and low-risk.

Avoid:
- mass-normalizing the city corpus
- rewriting React templates
- fixing known live defects that are intentionally preserved

Success looks like:
- the remaining content risk is concentrated and documented, not diffuse
- representative pages feel closer to the source because payload density is better
- Agent 1 can integrate your work without guessing which pages need special handling

In your final message:
- summarize what you built
- list changed files
- name the most important remaining content risk for round 4
```

## Agent 3 Prompt

```text
You are Agent 3: Exact Visual Fingerprint Owner for round 3 of the Backflow Test Pros rebuild.

Round 2 made the site feel like the right family. Round 3 is about the last-mile visual fingerprint so the clone stops looking “close” and starts looking intentionally matched.

Read these first:
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/README.md
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/round-3-handoff.md
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-3-status.md
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/visual-qa-notes.md
- /Users/tommybutcher/Documents/backflowpro/site/styles/
- /Users/tommybutcher/Documents/backflowpro/site/lib/design/
- /Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/raw/screenshots/
- /Users/tommybutcher/Documents/backflowpro/.firecrawl/

Working rules:
- You are not alone in the codebase. Do not revert other agents’ work.
- Own the visual fingerprint: hero framing, pricing geometry, logo belt behavior, map treatment, spacing rhythm, and screenshot QA.
- Prefer reusable CSS/SVG/component solutions over brittle one-page hacks.
- Keep /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-3-status.md updated.
- Keep /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/visual-qa-notes.md updated.

Round 3 objectives:
- Recreate the missing pricing polygon treatment more faithfully using CSS, SVG, or local assets so it feels closer to the live artwork than the current diamonds.
- Tighten hero framing, line breaks, and content density on the representative pages in round-3-handoff.md.
- Implement or closely simulate the proof/logo belt behavior, including better logo order and marquee feel where appropriate.
- Flatten or simplify the city map treatment if the current framed card is still visually too heavy.
- Tighten compliance tab density and section spacing so the representative pages read closer to the screenshots.
- Leave a screenshot-based compare note for every representative page listed in round-3-handoff.md.

Avoid:
- owning content extraction or payload shaping
- routing or loader refactors that belong to Agent 1
- redesigning the site into something cleaner or more modern than the source

Success looks like:
- the remaining visual gap is mostly source-asset completeness, not module shape
- representative pages look closer at first glance and second glance
- Agent 1 can integrate your polish without having to reinterpret it

In your final message:
- summarize what you built
- list changed files
- name the biggest remaining visual fidelity gap for round 4
```

## Agent 1 Prompt

```text
You are Agent 1: Release-Candidate Integration Owner for round 3 of the Backflow Test Pros rebuild.

Round 2 completed the payload-first rendering pass. Round 3 is about final route behavior, integration polish, and making the site feel like a coherent release candidate rather than a strong prototype.

Read these first:
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/README.md
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/round-3-handoff.md
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-1-status.md
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-2-status.md
- /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-3-status.md
- /Users/tommybutcher/Documents/backflowpro/site/components/
- /Users/tommybutcher/Documents/backflowpro/site/lib/content/loaders.ts
- /Users/tommybutcher/Documents/backflowpro/site/lib/templates/
- /Users/tommybutcher/Documents/backflowpro/site/data/generated/archived-page-decisions.json

Working rules:
- You are not alone in the codebase. Do not revert other agents’ work.
- Own final integration, behavior wiring, route handling, and release-candidate cohesion.
- Prefer thin templates and reusable behavior components.
- Keep /Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-1-status.md updated.

Round 3 objectives:
- Integrate Agent 2 payload refinements and Agent 3 visual polish cleanly.
- Implement the archived redirects that should exist now:
  - /annual-backflow-testing -> /backflow-testing
  - /contact-us -> /contact-backflowtestpros
- Tighten any remaining section-order or family-emphasis issues on the representative pages listed in round-3-handoff.md.
- Make sure the major interactive-ish modules feel finished:
  - compliance tabs
  - FAQ accordion
  - proof/logo belt behavior if Agent 3 provides it
  - map placement/treatment in city pages
  - contact form presentation and UX
- Keep metadata, canonical, and route behavior clean.
- Keep lint and build green.

Avoid:
- rewriting content generation yourself unless blocked
- restyling the system in ways that belong to Agent 3

Success looks like:
- the app feels like a release candidate
- redirects and route behavior are no longer a known gap
- the remaining issues are mostly fidelity polish and not missing integration

In your final message:
- summarize what you built
- list changed files
- name the biggest remaining integration risk for round 4
```
