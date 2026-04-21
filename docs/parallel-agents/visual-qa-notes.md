# Visual QA Notes

Use this file to track screenshot comparisons, layout mismatches, and fidelity gaps between the rebuild and the captured live site.

## Screenshot Reads

### `home.png`

- The live header stack is three parts, not one:
  dark promo bar, white nav bar, then the hero.
- Hero composition is centered and restrained:
  gold headline, white copy, gold phone CTA, minimal side noise.
- The client belt is shallow and logo-led.
  It reads like a compact white strip between larger sections, not a huge testimonial block.
- The feature grid uses icon-led cards with thin dividers, not chunky boxed cards.
- Pricing is visually defined by a center blue diamond and lighter side shapes.
- Footer is dense navy with gold headings and multiple compact columns.

### `backflow-installation.png`

- Core service pages reuse the same overall rhythm as home but replace some white sections with a left-rail compliance tab module.
- The compliance section is the strongest reusable desktop pattern after the hero.
  Left vertical rail, active navy tab, white content body.
- City/service-area link stacks are long and centered rather than cardified.

### `orange-county__irvine-backflow-testing-repair.png`

- County/city landings use a flat navy hero more often than a photo hero.
- The pricing block sits high on the page and is followed by a navy urgency/compliance band.
- Local service-area links appear before a map and before the detailed regulations block.
- Regulations content again uses the left-rail tab layout.

### `los-angeles-county-backflow-testing-installation-repair-service-areas.png`

- Service-area hubs are intentionally lighter and more index-like.
- The city-link list is effectively a narrow single-column directory with very little card treatment.
- These pages should feel sparse and navigational, not overdesigned.

## Round 1 Decisions Landed

- Typography system now biases to the captured PT Sans direction rather than the previous default/placeholder look.
- Captured palette is normalized into reusable tokens:
  navy `#262e4a`, gold `#ffb700`, soft off-white `#f6f6f6`, muted gray `#6a6a6a`.
- Shared visual primitives are now defined under `site/styles/` and wired into the app shell.
- A curated public asset library now exists under `site/public/assets/` with stable names instead of forensic filenames.
- Header/footer/hero chrome now uses captured logos/icons instead of placeholder text-only branding.
- Template families now switch hero mode at the system level:
  county/city pages and service-area hubs use the navy hero mode; core service pages stay photo-led except FAQs.
- Link clusters now collapse toward the narrow list treatment the screenshots show instead of always rendering as broad card grids.
- Pricing bands now use a geometric center-emphasis treatment instead of generic stacked cards.

## Remaining Fidelity Gaps

- Exact hero photography is still incomplete because several referenced live assets were not present in the downloaded forensic bundle.
- Pricing cards are CSS diamonds right now.
  The live site uses image-backed polygon treatments that still need the missing source textures restored.
- The home/client proof strip is static in the current system.
  The live site behaves more like a marquee belt.
- The regulation/compliance tabs have the right shell treatment available, but the current scaffold pages still need the richer content payloads and module wiring to match the captured density.
- Map treatment is documented and styled, but not yet wired into the city template flow as a real embedded section.

## Round 2 Compare Pass

### `home` rebuild vs `home.png`

- Hero, shallow logo belt, navy authority block, divider feature grid, pricing cluster, and dense footer now read as the same family as the capture.
- The page no longer looks like a generic Next scaffold.
  The main mismatch is now source-material specificity, not missing module structure.
- Remaining gap:
  the live hero composition is a little more restrained and centered, and the logo order still does not match one-to-one.

### `backflow-installation` rebuild vs `backflow-installation.png`

- The core-service family now has the right rhythm:
  hero, shallow client belt, white icon grid, center-emphasis pricing block, CTA banner, left-rail compliance tabs, dark regulations band, and stacked service-area directories.
- The pricing cluster and compliance rail now feel much closer to the live page than the round-1 scaffold.
- Remaining gap:
  hero photography/crop is close but not exact, and the pricing polygons are still CSS recreations rather than the missing live textures.

### `orange-county/irvine-backflow-testing-repair` rebuild vs `orange-county__irvine-backflow-testing-repair.png`

- County/city landings now follow the captured cadence:
  flat navy hero, price cluster near the top, dark urgency/compliance band, centered local directory, map frame, then regulation tabs.
- The dark urgency band was fixed in round 2.
  It now uses a real split two-column list treatment with inverse type instead of disappearing into navy-on-navy text.
- Remaining gap:
  the map frame is functional and visually useful, but the live capture is a little plainer and less card-like.

### `orange-county-backflow-testing-installation-repair-service-areas` rebuild vs `los-angeles-county-backflow-testing-installation-repair-service-areas.png`

- The hub family now feels sparse and navigational rather than over-carded.
- The hero, shallow proof strip, lightweight feature row, narrow stacked directories, and denser footer all align with the captured hub behavior.
- Remaining gap:
  the hub hero still breaks a bit taller than the live screenshot, and the CTA banner is more explicit than the quieter live page.

### `commercial-backflow-specialists/restaurant-food-services-backflow-testing-installation-repair-services` rebuild vs `commercial-backflow-specialists__restaurant-food-services-backflow-testing-installation-repair-services.png`

- The commercial vertical now uses the right module sequence:
  dark hero, proof strip, icon-led feature grid, centered pricing cluster, dark authority band, long-form risk/requirements sections, and the In-N-Out field photo CTA.
- A round-2 bug where proof-strip source text was leaking into the overview body is fixed.
- Remaining gap:
  the hero still reads denser than the live screenshot because the generated commercial payload carries more body copy than the source capture.

## Best Next Round

- Restore the missing hero and polygon source assets from the live references or recreate them with matching proportions.
- Tighten hero copy density and title line breaks so the navy-family pages land even closer to the captured center-weighted compositions.
- Replace the CSS-only pricing diamonds with closer polygon artwork once the missing source textures are recovered or recreated.
- Add true marquee behavior and source-accurate logo ordering to the proof/logo belt.
- Decide whether the city map treatment should stay as the current framed card or be flattened further to match the live screenshots more literally.
