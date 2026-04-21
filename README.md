# Backflow Test Pros Forensics

This workspace captures a public-forensics SEO clone dossier for `https://www.backflowtestpros.com/`.

## Site App

From the repo root, you can run the site app with:

```bash
npm run dev
npm run build
npm run lint
npm run start
```

These proxy into `/Users/tommybutcher/Documents/backflowpro/site`.

## Run

```bash
python3 scripts/collect_backflow_seo_forensics.py
python3 scripts/analyze_clone_gap_phase_two.py
```

## Outputs

The collector writes a dated dossier under `output/backflowtestpros_forensics/`:

- `url_inventory.csv`
- `page_seo_matrix.csv`
- `asset_manifest.csv`
- `authority_registry.csv`
- `recovery_gap_report.md`
- `wayback_snapshot_inventory.csv`
- `wayback_archived_only_pages.csv`
- `clone_gap_tracker.csv`
- `wayback_diff_report.md`
- `clone_execution_matrix.md`
- `raw/` with HTML, robots, sitemap, Firecrawl search JSON, screenshot JSON, screenshots, and downloaded first-party assets
