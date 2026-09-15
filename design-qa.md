# Contact quiz design QA

Final result: **blocked for production by live Maps configuration**. The implemented layout and locally testable interactions pass; live Google suggestion selection and map zoom have not been verified.

Reference: `contact-intake-ideation-20260914/desktop-photo-logos-concept.png`, with the subsequently approved “From local shops to national names.” heading. Mobile grounding: `quiz-refinement.png`. Implemented in the existing Next.js website from production SHA `9e79e11244cba5388ea1b98d733aa85d63dd03ef`.

## Visual review

Browser screenshots at 1536×1024, 1366×768, 768×1024, 390×844 and 375×812. No horizontal page overflow; all photo/logo assets load. Desktop retains the split quiz/map layout and the four selected brands in order. Mobile removes the map entirely, including network initialization, and uses a functional horizontal photo carousel. Final source and implementation screenshots were inspected together. The reference shows populated search results; the current no-key screenshot shows the honest manual fallback and regional map. Search-state visual verification is part of the Maps hold.

Local evidence (not committed): `qa/desktop-final.jpg`, `qa/mobile-initial.jpg`, `qa/mobile-service.jpg`, `qa/tablet.jpg`, `qa/local-provider-receipts.json`, `qa/test-results.txt`, `qa/build.log`.

## Verified behavior

- Manual address completeness errors; address preserved on back navigation.
- Repair, testing and installation flows in the real browser; all four service payloads in automated tests.
- Contact answers retained across back/forward navigation and a deliberately failed provider response.
- Failure → retry → success against the local HCP fixture, with exact address and service fields read back from the captured CRM packet.
- Date selection survives another field edit and reaches CRM notes as a preference, not a booking.
- Mobile carousel scroll, visible Back control after a long step, and zero hidden map iframes on phones.
- Keyboard suggestion selection, stale result cancellation, selection/edit race, missing configuration, provider failures, phone event deduplication, legacy form compatibility, size/gateway failures and preview send blocking through automated tests.
- Browser production build has no observed application console errors. A development image-priority warning was fixed by eagerly loading the first photo.
- Production build generates 262 routes. Typecheck and focused lint pass.

## Issues found and fixed

1. Back navigation could be scrolled above the mobile viewport after the manual form. New steps now restore the top when needed.
2. Editing during the map pause could advance with an obsolete address. Editing cancels the timer and invalidates the old coordinates.
3. Controlled date input could lose a value on a subsequent edit. Input/change handling now preserves it; verified in the browser and the local CRM packet.
4. The source Hilton logo had a baked checkerboard. Replaced for this page with the official white asset.
5. HTML 200 responses could be mistaken for accepted submissions. Success now requires `ok: true`.
6. Preview deployments inherited live CRM credentials. Preview requests are rejected before any external write; analytics are disabled in preview.

## Remaining hold

The production and preview website environment inventories contained no Maps key. Configure the website-owned key and run the real Google selection/zoom/readback checks in the release document before calling the feature production-ready. No customer messages, live CRM writes, calls or production deployment were performed for these tests.
