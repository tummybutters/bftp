# Centered contact page release — September 15, 2026

## Scope

Approved centered address-first contact quiz with real Mapbox search and compact map, device count, repair-credit-only display, and the In-N-Out, Costco, Amazon and Hilton photo row. Source starts from `50d3cd5`, which includes the production `42f5da9` review redirect. The existing normal AgentMail notification and HCP lead flow remains the receiver. No dedicated sales-intake preparation, invoice creation, outbound calls, or Voice/SMS credentials are added.

Testing flow: address → service → property → device count → timing → contact. Other services skip device count. Count is not preselected; unknown and blank More are never guessed. Exact counts are 1–100. Back/edit preserves data. Name, email and phone remain required; suite, company, preferred date, notes and uploads are available.

The server-only repair-credit policy endpoint returns the credit and policy version, not a testing price. Unknown/ineligible scope receives no numeric benefit. Client price input is ignored. Policy version `testing-20260915-v1` matches the approved testing rate card and caps the benefit at $500. It does not request an invoice or authorize a charge.

## Delivery and failures

Success requires an explicit `ok: true` from the contact endpoint after the existing email or CRM delivery. Provider rejection, non-JSON responses and connection failures retain the form. Double clicks are blocked while sending. There is no claim of durable exactly-once delivery across user retries.

The existing acknowledgement email honors the new Email me selection; its older call-or-email wording is bypassed for that choice.

Files remain private email attachments. If email fails while HCP accepts the request, the receipt explicitly identifies the missing attachment and provides the contact email. An accepted request is not presented as failed just because its attachment did not arrive.

A Vercel preview rejects contact submissions before any provider writes, even when live environment values are inherited. Preview analytics is disabled. No real customer submission, email, invoice or phone call was used for QA.

## Measurement

PostHog retains the existing project configuration. Custom funnel and telephone events also go to GA when configured. Funnel variant: `address_centered_v3`.

- `contact_quiz_viewed`: first page view after PostHog is initialized.
- `contact_quiz_started`: first address interaction, once per mounted quiz.
- `contact_quiz_step_viewed`, `contact_quiz_address_completed`, `contact_quiz_option_selected`, `contact_quiz_device_count_completed`: progress and selected categories/count certainty.
- `contact_address_suggestions`, search/retrieve failures, manual entry and incomplete result events: address friction, without address text or coordinates.
- `contact_preference_selected`, `contact_quiz_upload_prepared`, client validation failure: final-step friction.
- `form_submitted`, `form_submit_failed`, `form_submit_succeeded`: attempts and explicit API acceptance.
- `phone_cta_clicked`: one delegated listener for every supported company telephone link, including header, footer and contact-step links. Includes office, placement, page, and quiz step when relevant. It records a click, not a connected call.
- Existing server `lead_received`, `lead_delivered`, delivery failure and HCP completion events remain separate. They now flush after the response using Next `after`.

Analytics exceptions cannot block contact submission or phone links. Inputs, address results, contact address and filenames are masked from replay. New custom events contain no customer name, email, phone, notes, files or address. Measure views → starts → completion, with device category and phone-click exits; clicks alone are not proof of a lost lead or completed call.

## Configuration and rollout

Set the website's `NEXT_PUBLIC_MAPBOX_TOKEN` to the user-supplied public token. No Voice/SMS keys are involved. Mapbox billing is unchanged. Demo account caps can interrupt search/maps; explicit manual entry remains usable. Confirm standard access separately for sustained production Mapbox traffic.

The Vercel project is `bftp-v1`, root `site`. Preserve normal AgentMail/HCP/PostHog/GA production configuration. Do not enable any `BFTP_STL_*` preparation or calling flags. `.vercelignore` excludes local provider-fixture configuration, environment files and QA artifacts.

## Verification

29 focused tests passed: search races and keyboard selection, provider outage/manual fallback, service/back-state preservation, unknown counts, validation, credit policy/cap, real handler with captured provider requests, upload limit, preview write guard, failure/retry, attachment partial delivery and analytics exceptions. Scoped ESLint, TypeScript and Next production build passed.

Browser checks used live Mapbox retrieval for a public Santa Monica address. Desktop testing with two commercial devices displayed $238 repair credit only. A fictional local request failed as configured, retained details, then succeeded against a local HCP fixture. Readback preserved full address, suite, count, timing, notes and email preference. Mobile at 390px passed manual address entry, More 12 → Not sure, 50px count targets and no horizontal overflow. Local QA receipts/screenshots are excluded from source and deployments.
