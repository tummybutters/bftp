# Backflow Test Pros Content Layer

This folder is the structured content source for the rebuild.

## Generated datasets

The forensic payloads live in `site/data/generated/`:

- `home-pages.json`
- `about-pages.json`
- `contact-pages.json`
- `core-service-pages.json`
- `county-city-pages.json`
- `service-area-hubs.json`
- `commercial-vertical-pages.json`
- `county-service-hubs.json`
- `regulation-pages.json`
- `legal-pages.json`
- `archived-page-decisions.json`
- `content-anomalies.json`
- `page-index.json`
- `page-lookup.json`

## Regeneration

Run:

```bash
python3 site/lib/content/generate_page_payloads.py
```

The generator reads the forensic CSVs and raw HTML under `output/backflowtestpros_forensics/` and emits render-ready JSON payloads without normalizing away visible live-site defects.

## Notes

- Treat the generated JSON as build artifacts, not hand-edited content.
- Source taxonomy drift is preserved in `sourceTemplateFamily` while corrected render grouping is exposed in `family`.
- Each payload preserves ordered `sections` so templates can render hero copy, logo strips, pricing tiles, CTA banners, tabs, link lists, maps, FAQ content, forms, and rich text without page-by-page adapters.
- `page-lookup.json` is the authoritative path-keyed payload map for the whole live site.
- `site/lib/content/loaders.ts` exposes both family loaders and `loadPagePayloadByPath()` for server-side consumption.
