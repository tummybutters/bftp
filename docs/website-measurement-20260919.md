# Website measurement release — 2026-09-19

Scope: analytics and diagnostic metadata only. Existing page copy, layout, titles, metadata, URLs and customer workflows are unchanged.

## Staff / QA exclusion

Open `https://www.backflowtestpros.com/?bftp_analytics=off` as a full page navigation before browsing/testing. This browser's local storage retains the exclusion across visits. PostHog (including replay/autocapture) and Google Analytics are not initialized on excluded page loads; custom events are also blocked. Use the same browser/profile each time. Private windows and other devices require their own opt-out. To restore normal measurement, open `https://www.backflowtestpros.com/?bftp_analytics=on` as a full page navigation.

This is not a sandbox. Do not submit fictional customer requests: live form submission still creates real work and server-side delivery telemetry. Historical events are not erased or automatically classified as staff. Do not exclude visitors by IP/geography or heavy use alone.

New initialized PostHog clients register `measurement_version=2026-09-19`. Use that and `intake_variant` to avoid mixing old and corrected measurements. Count unique sessions through ordered steps rather than summing independent event totals. Service can be preselected by the homepage and therefore legitimately skipped.

## Notification evidence

The Sept 7–15 failed AgentMail events precede the Sept 17 Gmail migration. Do not describe them as proof of a present Gmail outage. Gmail authentication/read access is distinct from verified email delivery. Historical failure reason strings should remain historical; new events identify the actual mail transport. Never replay old submissions or send duplicate acknowledgments as part of analytics QA.

## Release checks

Run `npm --prefix site run test:contact`, TypeScript and the production build. No real lead submission is needed for these tests: provider calls are mocked. After deployment verify both a normal browser path and the explicit QA exclusion path without submitting. Leave customer-facing mail delivery marked unverified until a separately authorized test or genuine submission has exact provider receipts.

## 2026-09-24 conversion definition

- GA4 `form_submit_succeeded` is a key event. PostHog Web Analytics uses the `BFTP website lead accepted` action, limited to `form_submit_succeeded` on `backflowtestpros.com`, as its conversion goal. These represent a browser-observed accepted `/api/contact` response, not a booked job or revenue.
- Use the saved PostHog Web Analytics preset `BFTP production lead conversions` for the canonical `www.backflowtestpros.com` host and accepted-lead goal. The shared PostHog project also contains `qortana.com` traffic, so an unfiltered project view is not a BFTP conversion-rate denominator.
- Both the quiz and legacy contact forms include the opaque API `submission_id` on that event. Never add name, email, phone, address, free-text details, or attachment content to analytics properties.
- Server-side PostHog `lead_housecall_delivery_completed` includes the same `submission_id` and a delivery status for both queued and direct Housecall Pro paths. Join by `submission_id`, retain missing/failed delivery as its own state, and never infer delivery from a browser success event.
- Quote, booking, and revenue stages still require their own verified Housecall Pro/provider receipts. Do not label those stages complete or compute a closed-loop revenue rate from website events alone.
- GA4 sends one explicit `page_view` after gtag is ready on each client route change. Its page URL includes only approved campaign attribution parameters. In the GA4 web stream, the Enhanced Measurement browser-history page-change option is off; leave page-load and other useful enhanced events enabled.
- Compare like-for-like canonical-host date windows in GA4 and PostHog. Their session/visitor definitions differ, so do not reconcile their totals by subtraction. Use Search Console for aggregate search queries/pages and ranking, not a claimed person-level query-to-lead join.
