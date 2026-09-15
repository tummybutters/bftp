# Contact quiz release

The contact page now starts with the service address and takes visitors through five short questions. The selected desktop design uses a map beside the quiz and a single photo row ordered In-N-Out, Costco, Amazon, Hilton under “From local shops to national names.” Mobile keeps the quiz prominent and makes the photos scroll horizontally.

## Release status

Ready for design review. **Production is held for website Maps configuration and the live address-selection check.** No production website, Voice, SMS, invoice, call or customer record was changed during development.

Baseline: `9e79e11244cba5388ea1b98d733aa85d63dd03ef`, the website production deployment inspected on September 14, 2026. Branch: `codex/contact-quiz-redesign-20260914`.

## What changed

- Address → service → property → timing → contact. Choice buttons advance automatically. Back preserves answers. A short pause shows a selected address on the desktop map before advancing; reduced motion skips the pause.
- Uses Google Places Autocomplete (New), fresh session tokens, a Southern California bias and US results. Stale responses cannot overwrite new searches. Editing a selected address clears its old location and cancels pending advancement.
- Manual address entry remains available during provider failures. City/state/ZIP are collected with the street; no redundant county question. The server checks completeness. Places matching is not represented as independent postal/deliverability verification.
- Technical knowledge, device counts, dates, location notes, company and uploads are optional. The testing count defaults to “Not Sure.” Original upload compression and platform-safe size limits remain in place.
- Street/city/state/ZIP, unit/location notes and requested date reach the internal email summary and HCP notes. A requested date is labeled **not booked**. This release does not create a structured HCP service address or a scheduled job.
- The existing email/CRM delivery path remains. Only a confirmed API acknowledgement displays success; gateway failures preserve the form. This work does not add speed-to-lead calling, invoicing or durable downstream reconciliation.
- One sitewide owner records `phone_cta_clicked` for business telephone links, including header, hero, content and footer. Office telephone text is now clickable. No customer-entered phone numbers, addresses or free text go into these events. Inputs and contact detail text are masked from PostHog autocapture/replay.
- Vercel preview deployments reject contact submissions before any provider call and disable production analytics. This matters because the existing project has live HCP credentials in preview environments.
- Next.js and its matching lint configuration move from 16.2.4 to 16.3.5; the lockfile also takes the compatible protobufjs security update. Production dependency audit: zero high/critical findings; 13 existing moderate findings remain. No forced major upgrades were applied.

## Required Maps configuration

Use a website-owned Google Cloud project with billing and **Maps JavaScript API** plus **Places API (New)** enabled. Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to the website's Vercel environments. This is a browser key: restrict HTTP referrers to the exact website/preview domains and restrict API access to these two APIs. Set quotas/alerts for this project. Do not use Voice or SMS credentials.

After configuring the key, rebuild the preview (the public variable is compiled at build time). Verify a real public service address by mouse and keyboard, confirm the pin/zoom matches the selected street and city, edit it before auto-advance, and confirm the final packet has the revised address. Check missing-result, disabled-key and manual-entry paths. Then approve production deployment separately.

## Analytics interpretation

Use `intake_variant=address_first_v2` for the new flow. `contact_quiz_started` now means the first address interaction, so it must not be directly compared to the old first-service-choice definition. Track the sequence: contact page visit → address interaction → `contact_quiz_address_completed` → service choice → `form_submit_succeeded`, plus `form_submit_failed` and phone taps. Count unique people and segment mobile/desktop. A phone click is not proof of a connected call.

Primary metric: completed requests or phone taps per contact-page visitor. Report request conversion and call intent separately. The earlier 77-visitor sample is a baseline, not evidence that this design improves conversion.

## Verification

Verified on September 14, 2026: 22 focused tests, TypeScript, focused lint and the 262-route production build passed. Browser testing covered 375, 390, 768, 1366 and 1536 pixel widths. See `design-qa.md` for browser evidence. Run `npm ci`, `npm run test:contact`, `npx tsc --noEmit`, focused ESLint, and `npm run build` in `site/`.

Local full-handler QA uses `node scripts/contact-preview-provider.mjs` and a local Next server with `HOUSECALLPRO_API_KEY=local-test-only` and `HOUSECALLPRO_API_BASE_URL=http://127.0.0.1:4174`. No live provider keys belong in this test. The fixture records requests at `/receipts`; POST `/mode` with `{ "fail": true }` exercises recovery. Automated handler tests replace every provider fetch and inspect notification/CRM payloads.

## Assets and provenance

The photo backgrounds are existing BFTP images. The row identifies clients; it does not claim every photo depicts a project for the overlaid brand. The mockup used illustrative combinations and duplicated Costco's photo for Hilton; implementation uses the original Hilton photo. Hilton's old PNG contained a baked checkerboard, so this page uses the clean white logo from its [official media library](https://stories.hilton.com/hilton-hotels/media-library).

## Deployment and rollback

Keep the existing Vercel project `bftp-v1` with root directory `site`. Review the branch before merging. Verify the ready deployment and the live contact route after approval. Roll back to the prior Vercel production deployment if needed; no data migration is required. The old non-contact forms keep their existing validation contract.
