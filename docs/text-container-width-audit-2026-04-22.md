# Text Container Width Audit

Date: 2026-04-22

## Fixed

- `site/styles/patterns.css`
  - `.bftp-tab-panel__tab-label`: removed the `16ch` cap that was scrunching desktop sidebar/tab labels.
  - `.bftp-cta-banner__title`: removed the `18ch` cap that was forcing CTA banner headlines into narrow stacked lines.
  - `.bftp-svc-accordion__heading`: added `min-width: 0` and `text-wrap: pretty` as a guard for long accordion headings in flex layouts.

## Other Cases To Watch

- `site/styles/patterns.css`
  - `.bftp-map-frame__overlay` uses `width: min(100%, 360px)`.
  - Risk: long location names or multi-line overlay copy can start to feel boxed in on medium-width screens.

- `site/styles/patterns.css`
  - `.bftp-pricing__diamond` uses `width: min(100%, 206px)` and the mobile variant uses `220px`.
  - Risk: if pricing labels get longer, the fixed diamond shape will force tighter line breaks.

- `site/styles/patterns.css`
  - `.bftp-icon-grid__copy` uses `max-width: 28ch`.
  - Risk: body copy can look overly columnized if editors start writing longer blurbs.

## Notes

- The two most visible issues were hard character-count caps on title text, not missing space in the surrounding layout.
- I did not broaden the lower-risk cases above yet because they may still be intentional design constraints.
