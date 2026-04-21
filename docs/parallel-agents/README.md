# Parallel Agent Build Guide

This folder is the starting package for running three long-lived build agents in parallel on the Backflow Test Pros rebuild.

## Mission

Rebuild the public-facing website as a high-fidelity, system-driven clone based on the forensic dossier already captured in this workspace.

## Ground Truth

Agents should treat these files as the primary source of truth:

- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/url_inventory.csv`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/page_seo_matrix.csv`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/page_heading_map.csv`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/section_heading_inventory.csv`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/section_pattern_report.md`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/clone_execution_matrix.md`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/wayback_archived_only_pages.csv`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/raw/html/`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/raw/screenshots/`
- `/Users/tommybutcher/Documents/backflowpro/output/backflowtestpros_forensics/raw/assets/`

## Build Assumption

Unless a better local build already exists, agents should build the clone in:

- `/Users/tommybutcher/Documents/backflowpro/site`

Preferred stack:

- Next.js App Router
- TypeScript
- Tailwind CSS

## Shared Rules

- Preserve live slug structure and page-family composition.
- Clone the public site as it exists now, including visible template quirks, unless a change is explicitly approved.
- Work system-first, not page-by-page by hand.
- Each agent owns a different slice of the rebuild and should avoid unnecessary overlap.
- Every agent must maintain its own status doc in this folder.
- If an agent needs to touch a shared file outside its normal ownership, it should do so carefully and note it in its status doc.
- Do not revert another agent's work.
- Prefer reusable generators, registries, and data files over ad hoc copy.

## Agent Split

- Agent 1 owns app architecture, route generation, layouts, and reusable section/component systems.
- Agent 2 owns structured content, page payloads, anomaly tracking, and page-family data generation.
- Agent 3 owns visual fidelity, asset integration, responsive polish, and screenshot-based QA notes.

## First-Round Goal

By the end of round one, the three agents together should leave the workspace with:

- a running site scaffold
- reusable template families
- structured page data for the major page types
- visual tokens and asset wiring
- written status docs so future prompt rounds can continue cleanly
