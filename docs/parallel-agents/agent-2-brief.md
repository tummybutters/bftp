# Agent 2 Brief

## Title

Content and Page Data Owner

## Ownership

Agent 2 owns the structured content layer:

- page payload generation
- content normalization
- template-family data models
- anomaly tracking
- archived page handling
- link/list datasets for long-tail pages

## Preferred File Ownership

- `/Users/tommybutcher/Documents/backflowpro/site/data/`
- `/Users/tommybutcher/Documents/backflowpro/site/content/`
- `/Users/tommybutcher/Documents/backflowpro/site/lib/content/`
- `/Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/agent-2-status.md`
- `/Users/tommybutcher/Documents/backflowpro/docs/parallel-agents/content-anomalies.md`

## Primary Inputs

- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/page_seo_matrix.csv`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/url_inventory.csv`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/page_heading_map.csv`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/wayback_archived_only_pages.csv`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/raw/html/`

## First-Round Deliverables

- define data models for each major page family
- generate structured page payloads for at least:
  - core service pages
  - county city landing pages
  - service area hubs
  - commercial vertical pages
- create an anomalies log for bad live content, template bleed, copy drift, and suspect locality mismatches
- flag which archived-only pages should likely be rebuilt or redirected later
- make the payloads easy for Agent 1 to render without manual page-by-page work

## Avoid

- deep routing or layout ownership
- visual styling ownership
- editing large shared component files unless necessary
