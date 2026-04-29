# Backflow Test Pros Site

Production-facing Next.js app for `backflowtestpros.com`.

## Run

```bash
npm run dev
npm run build
npm run lint
```

Run these from the repo root or from `site/`.

## Architecture

- `app/`: App Router entrypoints, layout metadata, `robots.ts`, and `sitemap.ts`
- `components/chrome/`: shared header, footer, shell, and nav UI
- `components/sections/`: reusable marketing-page sections
- `components/templates/`: page-family templates and the page renderer
- `lib/content/`: generated content loaders, page metadata, and catalog helpers
- `lib/site-config.ts`: business contact info, nav structure, footer content, and other hand-maintained site settings
- `data/generated/`: build artifacts generated from the forensic/content pipeline

## Adding Or Updating Pages

1. Update the source forensic/content inputs under `output/backflowtestpros_forensics/` when the source content changes.
2. Regenerate payloads with `python3 site/lib/content/generate_page_payloads.py`.
3. If the page should appear in shared navigation or footer chrome, update `site/lib/site-config.ts`.
4. Build the app with `npm run build` before publishing.

## SEO And Shared Metadata

- Shared site metadata lives in `app/layout.tsx`.
- Per-page metadata is built in `lib/content/site-index.ts`.
- `app/sitemap.ts` and `app/robots.ts` stay in sync with the generated page catalog automatically.

## Maintenance Notes

- Treat `data/generated/*.json` as generated output, not hand-authored source.
- Keep reusable business details in `lib/site-config.ts` instead of hardcoding them inside components.
- Prefer server components for shared chrome and use small client islands only where interaction or analytics requires them.

## Contact Form Email

- `AGENTMAIL_API_KEY`: required to send contact-form email notifications.
- `AGENTMAIL_INBOX_ID`: optional explicit sender inbox ID. When omitted, the app discovers the first inbox available to the key.
- `CONTACT_NOTIFICATION_TO`: optional recipient for form notifications. Defaults to the sender inbox if unset.
- `AGENTMAIL_FROM_NAME`: optional label used in the customer auto-reply subject line.
- `CONTACT_AUTOREPLY_ENABLED`: optional `true`/`false` flag for customer auto-replies. Keep this off until the inbox send allow list includes recipient domains you want to email.
- `CONTACT_AUTOREPLY_DELAY_SECONDS`: deprecated for now. Delayed auto-replies are not active in production, but we may revisit them later with a more reliable background-send path.
- `CONTACT_AUTOREPLY_EXPECT_CALL_FROM`: optional wording for who will call or email next. Defaults to `our scheduling team`.
- `CONTACT_AUTOREPLY_RESPONSE_WINDOW`: optional wording for response timing. Defaults to `within one business day`.
- `OPENROUTER_API_KEY`: optional key for AI-personalized customer auto-replies.
- `OPENROUTER_MODEL`: optional OpenRouter model slug for auto-reply generation. Defaults to `minimax/minimax-m2.7`.
- `OPENROUTER_HTTP_REFERER`: optional OpenRouter attribution header. Defaults to the configured site URL.
- `OPENROUTER_APP_TITLE`: optional OpenRouter attribution title. Defaults to the site name.

## Housecall Pro Lead Push

- `HOUSECALLPRO_API_KEY`: optional Housecall Pro API key for server-side lead creation from the contact form.
- `HOUSECALLPRO_API_BASE_URL`: optional API base URL override. Defaults to `https://api.housecallpro.com`.
- `HOUSECALLPRO_CUSTOMERS_PATH`: optional customer-create path override. Defaults to `/customers`.
- `HOUSECALLPRO_LEADS_PATH`: optional lead-create path override. Defaults to `/leads`.

The contact route will try to fan out to both AgentMail and Housecall Pro when both are configured. If only one downstream path is configured and succeeds, the form still returns success.
