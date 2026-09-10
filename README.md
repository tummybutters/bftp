# Backflow Test Pros

The website for [Backflow Test Pros](https://www.backflowtestpros.com), a Southern California backflow testing, repair, replacement, and compliance service.

The production site includes service pages, commercial property pages, location-focused content, a resource blog, contact intake, and analytics.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vercel
- PostHog and Google Analytics

## Local Development

Install the site dependencies:

```bash
npm --prefix site install
```

Start the local development server:

```bash
npm run dev
```

The site will be available at [http://localhost:3000](http://localhost:3000).

## Commands

Run these commands from the repository root:

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run lint      # Run ESLint
npm run start     # Start the production server
```

Blog-specific commands run from the `site` workspace:

```bash
npm --prefix site run blog:build-index
npm --prefix site run blog:validate
```

## Project Structure

```text
site/
  app/              Next.js routes and API handlers
  components/       Shared UI and page sections
  content/          Site content sources
  data/generated/   Generated page and blog data
  lib/              Analytics, content, and design utilities
  public/           Static assets
  scripts/          Blog build and validation scripts
  styles/           Shared visual patterns
```

The root-level `scripts/`, `docs/`, and `output/` directories contain supporting migration, research, and site-recovery materials. The production application lives in `site/`.

## Blog Workflow

Blog entries are stored in `site/data/generated/blog-posts.json`. After changing blog content:

1. Rebuild `blog-index.json`.
2. Run the blog validator.
3. Run the production build.
4. Confirm the blog index and article route render correctly.

```bash
npm --prefix site run blog:build-index
npm --prefix site run blog:validate
npm run build
```

## Environment Variables

Local environment variables are required for integrations such as contact intake, analytics, email notifications, and Housecall Pro. Keep credentials in local or Vercel environment configuration and never commit secret values.

Public analytics configuration uses:

```text
NEXT_PUBLIC_GA_MEASUREMENT_ID
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
```

## Deployment

Production is deployed through Vercel from the `main` branch. The live site is available at [www.backflowtestpros.com](https://www.backflowtestpros.com).
