# Blog Content Data Spec

## QueueRecord

`QueueRecord` is the normalized workbook row used for editorial selection and future automation.

Fields:

- `id`
- `articleTitle`
- `category`
- `sheetName`
- `audience`
- `geography`
- `templateType`
- `primaryKeyword`
- `secondaryKeywords`
- `sourceStats`
- `ctaType`
- `slug`
- `status`
- `notes`

`sourceStats` is an array of repository-backed source pointers. Each item includes:

- `repositoryRow`
- `dataPoint`
- `value`
- `scope`
- `timePeriod`
- `whyItMatters`
- `sourceOrganization`
- `sourceTitle`
- `sourceUrl`
- `authorityType`
- `notes`

## BlogPost

`BlogPost` is the full internal article record stored in `site/data/generated/blog-posts.json`.

Fields:

- `slug`
- `path`
- `canonical`
- `title`
- `metaDescription`
- `excerpt`
- `category`
- `audience`
- `geography`
- `templateType`
- `primaryKeyword`
- `secondaryKeywords`
- `publishedAt`
- `updatedAt`
- `heroFact`
- `keyTakeaways`
- `sections`
- `internalLinks`
- `cta`
- `imageBrief`
- `schemaTypes`
- `reviewFlags`
- `status`
- `sourceNotes`

Notes:

- `sourceNotes` is internal-only and must never be emitted into the public blog index.
- `sections` can currently be:
  - `narrative`
  - `checklist`
  - `faq`
- `reviewFlags` explain why a post is held back or needs human attention.

## PublicBlogPost

`PublicBlogPost` is the public projection of `BlogPost` with `sourceNotes` removed.

Use it for:

- `/blog/[slug]`
- metadata generation
- JSON-LD generation
- any UI-facing post rendering

## BlogIndexEntry

`BlogIndexEntry` is the lightweight public listing record stored in `site/data/generated/blog-index.json`.

Fields:

- `slug`
- `path`
- `canonical`
- `title`
- `excerpt`
- `category`
- `audience`
- `geography`
- `templateType`
- `primaryKeyword`
- `heroFact`
- `publishedAt`
- `updatedAt`
- `status`

Rules:

- Only `Published` posts belong in the index.
- The index must be derived from `blog-posts.json`.
- The index must never include `sourceNotes`.

## Conservative Publication Rules

- `refresh_update_article` stays unpublished until current language is verified
- localized titles must be supported throughout the body, not just in the headline
- exact slug conflicts with the service-page catalog are disallowed
- exact title conflicts with the service-page catalog are disallowed
- every published post needs:
  - at least one real fact
  - a CTA
  - at least one internal link
  - enough body copy to function as a real article
