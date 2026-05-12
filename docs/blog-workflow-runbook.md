# Blog Workflow Runbook

## What Exists Now

- Public blog routes:
  - `/blog`
  - `/blog/[slug]`
- Data contracts:
  - `site/lib/blog/types.ts`
- Public loaders and metadata helpers:
  - `site/lib/blog/loaders.ts`
  - `site/lib/blog/metadata.ts`
- Seed content artifacts:
  - `site/data/generated/blog-posts.json`
  - `site/data/generated/blog-index.json`
  - `site/data/generated/blog-queue.json`

## Queue Flow

1. Export normalized queue records from the workbook.
2. Review the queue for duplicate angles, review flags, and template routing.
3. Draft new `BlogPost` records against approved queue items.
4. Rebuild the lightweight public index.
5. Validate the data contracts and duplicate checks.
6. Build the site.

## Queue Export

Generate the queue from the workbook:

```bash
/Users/tommybutcher/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  scripts/export_blog_workbook_queue.py \
  /Users/tommybutcher/Downloads/backflow_plumbing_ground_truth_repository_complete_article_system.xlsx
```

This writes `site/data/generated/blog-queue.json`.

## Public Index Build

Rebuild the public index after editing `blog-posts.json`:

```bash
npm --prefix site run blog:build-index
```

This writes `site/data/generated/blog-index.json`.

## Validation

Run the conservative data checks:

```bash
npm --prefix site run blog:validate
```

The validator checks:

- post and queue schema shape
- published post dates
- slug and title conflicts against existing site pages
- missing facts or CTA blocks
- placeholder text
- refresh-update publication blocking
- localized support in published content
- index drift between `blog-posts.json` and `blog-index.json`
- `sourceNotes` leakage into the public index

## Local Development

Run the app locally:

```bash
npm --prefix site run dev
```

Then review:

- `http://localhost:3000/blog`
- `http://localhost:3000/blog/<slug>`

## Recommended Draft Workflow

- Keep review-only or draft-only entries in `blog-posts.json` with `status` set appropriately.
- Only `Published` posts are emitted into `blog-index.json`, routed under `/blog/[slug]`, and surfaced in `sitemap.xml`.
- Keep `sourceNotes` inside `blog-posts.json` only.
- Use the related-links block to hand readers off to service, regulation, and service-area pages that already exist.

## Failure Recovery

- If `blog:validate` fails on slug/title duplication:
  - change the title angle before changing the service-page catalog
- If `blog:validate` fails on localized support:
  - either strengthen geography in the body or set the post back to `Review Required`
- If `blog:validate` fails on refresh publication:
  - keep the post unpublished until a reviewer confirms the latest rule or stat language
