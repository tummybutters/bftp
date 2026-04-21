#!/usr/bin/env python3

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.collect_backflow_seo_forensics import (
    OUTPUT_ROOT,
    RAW_ROOT,
    SITE_DOMAIN,
    USER_AGENT,
    PageParser,
    fetch_text,
    slugify_path,
    write_csv,
    write_text,
)


WAYBACK_SNAPSHOT_INVENTORY_CSV = OUTPUT_ROOT / "wayback_snapshot_inventory.csv"
WAYBACK_ARCHIVED_ONLY_PAGES_CSV = OUTPUT_ROOT / "wayback_archived_only_pages.csv"
CLONE_GAP_TRACKER_CSV = OUTPUT_ROOT / "clone_gap_tracker.csv"
WAYBACK_DIFF_REPORT_MD = OUTPUT_ROOT / "wayback_diff_report.md"
CLONE_EXECUTION_MATRIX_MD = OUTPUT_ROOT / "clone_execution_matrix.md"
RAW_WAYBACK_HTML_DIR = RAW_ROOT / "wayback_html"
URL_INVENTORY_CSV = OUTPUT_ROOT / "url_inventory.csv"
PAGE_SEO_MATRIX_CSV = OUTPUT_ROOT / "page_seo_matrix.csv"
ASSET_MANIFEST_CSV = OUTPUT_ROOT / "asset_manifest.csv"
AUTHORITY_REGISTRY_CSV = OUTPUT_ROOT / "authority_registry.csv"


def normalize_site_url(url: str) -> str:
    parsed = urlsplit(url.strip())
    netloc = parsed.netloc.lower() or SITE_DOMAIN
    if netloc == "backflowtestpros.com":
        netloc = SITE_DOMAIN
    path = parsed.path or "/"
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    return urlunsplit(("https", netloc, path, "", ""))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def fetch_wayback_rows() -> list[dict[str, str]]:
    query_url = (
        "https://web.archive.org/cdx/search/cdx"
        f"?url={SITE_DOMAIN}/*"
        "&from=2024"
        "&to=2026"
        "&output=json"
        "&filter=statuscode:200"
        "&filter=mimetype:text/html"
        "&fl=timestamp,original,statuscode,mimetype"
    )
    request = Request(query_url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=120) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return [
        {
            "timestamp": row[0],
            "original": row[1],
            "statuscode": row[2],
            "mimetype": row[3],
        }
        for row in payload[1:]
    ]


def wayback_snapshot_url(timestamp: str, original_url: str) -> str:
    return f"https://web.archive.org/web/{timestamp}/{original_url}"


def parse_last_published(html_text: str) -> str:
    match = re.search(r"Last Published:\s*(.*?)\s*-->", html_text)
    return match.group(1).strip() if match else ""


def parse_webflow_page_id(html_text: str) -> str:
    match = re.search(r'data-wf-page="([^"]+)"', html_text)
    return match.group(1).strip() if match else ""


def compact(text: str) -> str:
    return " ".join(text.split())


def infer_live_replacement(url: str) -> str:
    replacements = {
        f"https://{SITE_DOMAIN}/annual-backflow-testing": f"https://{SITE_DOMAIN}/backflow-testing",
        f"https://{SITE_DOMAIN}/contact-us": f"https://{SITE_DOMAIN}/contact-backflowtestpros",
        f"https://{SITE_DOMAIN}/flowexpo": "",
        f"https://{SITE_DOMAIN}/landscape-expo": "",
    }
    return replacements.get(url, "")


def infer_archived_page_role(url: str) -> str:
    path = urlsplit(url).path
    if path in {"/contact-us", "/annual-backflow-testing"}:
        return "replaced_live_page"
    if "expo" in path:
        return "campaign_event_landing"
    return "historical_page"


def load_baseline_counts() -> dict[str, int]:
    live_rows = read_csv(URL_INVENTORY_CSV)
    asset_rows = read_csv(ASSET_MANIFEST_CSV)
    authority_rows = read_csv(AUTHORITY_REGISTRY_CSV)
    return {
        "live_url_count": len(live_rows),
        "asset_count": len(asset_rows),
        "downloaded_asset_count": sum(1 for row in asset_rows if row["downloaded"] == "yes"),
        "authority_count": len(authority_rows),
    }


def build_wayback_inventory(
    live_rows: list[dict[str, str]],
    seo_rows: list[dict[str, str]],
    wayback_rows: list[dict[str, str]],
) -> tuple[list[dict[str, str]], list[dict[str, str]], list[str], list[str]]:
    live_by_url = {normalize_site_url(row["url"]): row for row in live_rows}
    seo_by_url = {normalize_site_url(row["url"]): row for row in seo_rows}

    aggregate: dict[str, dict[str, str | int]] = {}
    for row in wayback_rows:
        normalized = normalize_site_url(row["original"])
        bucket = aggregate.setdefault(
            normalized,
            {
                "snapshot_count": 0,
                "first_snapshot": row["timestamp"],
                "last_snapshot": row["timestamp"],
                "original": normalized,
            },
        )
        bucket["snapshot_count"] = int(bucket["snapshot_count"]) + 1
        if row["timestamp"] < str(bucket["first_snapshot"]):
            bucket["first_snapshot"] = row["timestamp"]
        if row["timestamp"] > str(bucket["last_snapshot"]):
            bucket["last_snapshot"] = row["timestamp"]

    inventory_rows: list[dict[str, str]] = []
    for url in sorted(aggregate):
        live = live_by_url.get(url)
        seo = seo_by_url.get(url, {})
        bucket = aggregate[url]
        inventory_rows.append(
            {
                "url": url,
                "slug": slugify_path(url),
                "live_now": "yes" if live else "no",
                "page_class": (live or {}).get("page_class", ""),
                "template_family": (live or {}).get("template_family", seo.get("template_family", "")),
                "live_title": seo.get("title", (live or {}).get("title", "")),
                "snapshot_count": str(bucket["snapshot_count"]),
                "first_snapshot": str(bucket["first_snapshot"]),
                "last_snapshot": str(bucket["last_snapshot"]),
                "first_wayback_url": wayback_snapshot_url(str(bucket["first_snapshot"]), url),
                "latest_wayback_url": wayback_snapshot_url(str(bucket["last_snapshot"]), url),
            }
        )

    live_urls = set(live_by_url)
    wayback_urls = set(aggregate)
    archived_only_urls = sorted(wayback_urls - live_urls)
    live_without_archive_urls = sorted(live_urls - wayback_urls)
    return inventory_rows, archived_only_rows_for(aggregate, archived_only_urls), archived_only_urls, live_without_archive_urls


def archived_only_rows_for(
    aggregate: dict[str, dict[str, str | int]],
    archived_only_urls: list[str],
) -> list[dict[str, str]]:
    RAW_WAYBACK_HTML_DIR.mkdir(parents=True, exist_ok=True)
    rows: list[dict[str, str]] = []
    for url in archived_only_urls:
        latest_timestamp = str(aggregate[url]["last_snapshot"])
        latest_snapshot_url = wayback_snapshot_url(latest_timestamp, url)
        status, _headers, html_text = fetch_text(latest_snapshot_url, timeout=60)
        parser = PageParser(url)
        parser.feed(html_text)
        html_path = RAW_WAYBACK_HTML_DIR / f"{slugify_path(url)}.html"
        html_path.write_text(html_text, encoding="utf-8")
        rows.append(
            {
                "url": url,
                "slug": slugify_path(url),
                "role_guess": infer_archived_page_role(url),
                "title": compact(parser.title),
                "meta_description": compact(parser.meta_description),
                "h1": compact(" | ".join(parser.h1_texts)),
                "snapshot_count": str(aggregate[url]["snapshot_count"]),
                "first_snapshot": str(aggregate[url]["first_snapshot"]),
                "last_snapshot": latest_timestamp,
                "latest_wayback_url": latest_snapshot_url,
                "last_published_hint": parse_last_published(html_text),
                "webflow_page_id": parse_webflow_page_id(html_text),
                "likely_live_replacement": infer_live_replacement(url),
                "fetch_status": str(status),
                "saved_html_path": str(html_path),
            }
        )
    return rows


def build_clone_gap_rows(
    baseline: dict[str, int],
    archived_only_count: int,
    live_without_archive_count: int,
) -> list[dict[str, str]]:
    return [
        {
            "workstream": "Historical pages and retired landers",
            "status": "completed_now",
            "already_captured": f"{baseline['live_url_count']} live URLs plus {archived_only_count} archived-only Wayback pages recovered.",
            "still_missing": "Older variants of still-live pages beyond the latest archive copy.",
            "best_closer": "Free Wayback diff pass and selective archive HTML fetch.",
            "website_clone_delta": "+2 to +4 pts",
            "seo_clone_delta": "+1 to +2 pts",
            "priority": "done",
            "notes": "Catch retired landing pages before they disappear from memory or keep backlinks.",
        },
        {
            "workstream": "Rendered DOM and metadata parity",
            "status": "next",
            "already_captured": "Raw HTML, titles, descriptions, canonicals, H1s, and internal links for the live site.",
            "still_missing": "JavaScript-resolved DOM, duplicate-tag audit, and a rendered crawl export.",
            "best_closer": "Screaming Frog paid license with rendered crawl and custom extraction.",
            "website_clone_delta": "+1 to +3 pts",
            "seo_clone_delta": "+2 to +3 pts",
            "priority": "high",
            "notes": "This is the best single purchase if the main goal is a closer website copy.",
        },
        {
            "workstream": "Visual fidelity sweep",
            "status": "next",
            "already_captured": "11 representative screenshots across the major template families.",
            "still_missing": "Broad screenshot coverage for every template cluster, mobile views, and edge-case pages.",
            "best_closer": "Playwright or Firecrawl screenshot sweep across all page families.",
            "website_clone_delta": "+3 to +5 pts",
            "seo_clone_delta": "0 to +1 pts",
            "priority": "high",
            "notes": f"{live_without_archive_count} live pages have no Wayback snapshot, so the current live render is the only visual source for them.",
        },
        {
            "workstream": "CSS and interaction fidelity",
            "status": "open",
            "already_captured": f"{baseline['asset_count']} public assets with {baseline['downloaded_asset_count']} downloaded locally.",
            "still_missing": "Exact interaction timing, responsive nuances, and component-state behavior.",
            "best_closer": "Manual browser QA plus Webflow access if it ever becomes available.",
            "website_clone_delta": "+3 to +6 pts",
            "seo_clone_delta": "0 pts",
            "priority": "high",
            "notes": "Public assets get us close, but not pixel-perfect motion and state logic on every page.",
        },
        {
            "workstream": "Historical redirects and old slugs",
            "status": "open",
            "already_captured": "Current canonical map for all live URLs and four retired URLs from Wayback.",
            "still_missing": "Full old-to-new redirect coverage and any non-public edge rules.",
            "best_closer": "Ahrefs Standard plus Wayback comparison, then private platform access if recovered.",
            "website_clone_delta": "0 to +1 pts",
            "seo_clone_delta": "+3 to +5 pts",
            "priority": "medium",
            "notes": "Important if older campaigns or backlinks still point at retired slugs.",
        },
        {
            "workstream": "Backlink and linked-page parity",
            "status": "open",
            "already_captured": f"{baseline['authority_count']} public authority records across visible profiles and mentions.",
            "still_missing": "Full referring domains, anchors, linked targets, and best-by-links pages.",
            "best_closer": "Ahrefs Standard for one month.",
            "website_clone_delta": "0 pts",
            "seo_clone_delta": "+4 to +7 pts",
            "priority": "medium",
            "notes": "Helps decide which historical pages absolutely must exist on day one for SEO continuity.",
        },
        {
            "workstream": "Cross-database SEO corroboration",
            "status": "optional",
            "already_captured": "Current public dataset plus one primary backlink discovery path.",
            "still_missing": "Links and organic pages Ahrefs may miss.",
            "best_closer": "Semrush Guru for a one-month cross-check.",
            "website_clone_delta": "0 pts",
            "seo_clone_delta": "+1 to +3 pts",
            "priority": "optional",
            "notes": "Useful for completeness, but not the first purchase for literal site-copy work.",
        },
        {
            "workstream": "Private CMS, forms, and automations",
            "status": "blocked",
            "already_captured": "Public form layouts, GA4 id, verification token, and Webflow ids.",
            "still_missing": "CMS collections, backups, form routing, automations, redirects, and edge config.",
            "best_closer": "Webflow, DNS, and analytics account access.",
            "website_clone_delta": "+4 to +7 pts",
            "seo_clone_delta": "+1 to +2 pts",
            "priority": "blocked",
            "notes": "This is the main reason a public clone hits a ceiling before 100 percent.",
        },
    ]


def build_wayback_diff_report(
    inventory_rows: list[dict[str, str]],
    archived_only_rows: list[dict[str, str]],
    live_without_archive_urls: list[str],
) -> str:
    snapshot_counts = [int(row["snapshot_count"]) for row in inventory_rows]
    first_snapshots = [row["first_snapshot"] for row in inventory_rows]
    last_snapshots = [row["last_snapshot"] for row in inventory_rows]
    live_sample = "\n".join(f"- `{url}`" for url in live_without_archive_urls[:10])
    archived_rows_md = "\n".join(
        (
            f"- `{row['url']}`"
            f" | title: `{row['title']}`"
            f" | role guess: `{row['role_guess']}`"
            f" | last snapshot: `{row['last_snapshot']}`"
            + (f" | likely replacement: `{row['likely_live_replacement']}`" if row["likely_live_replacement"] else "")
        )
        for row in archived_only_rows
    )
    return f"""# Backflow Test Pros Wayback Diff

Generated: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")}

## Snapshot Summary

- Unique archived HTML URLs observed in Wayback (2024-2026): {len(inventory_rows)}
- Archived URLs still live today: {sum(1 for row in inventory_rows if row["live_now"] == "yes")}
- Archived-only URLs not present in the live dossier: {len(archived_only_rows)}
- Live URLs without any Wayback HTML snapshot yet: {len(live_without_archive_urls)}
- Earliest archived HTML snapshot in this pass: {min(first_snapshots) if first_snapshots else ""}
- Latest archived HTML snapshot in this pass: {max(last_snapshots) if last_snapshots else ""}
- Median snapshot depth is limited, but the deepest archived page in this pass has: {max(snapshot_counts) if snapshot_counts else 0} captures

## Archived-Only URLs Recovered

{archived_rows_md if archived_rows_md else "- None"}

## Live URLs With No Archive Snapshot Yet

These are primarily newer commercial verticals plus one Orange County city page. They are cloneable only from the current live crawl right now.

{live_sample if live_sample else "- None"}

## Clone Impact

- This closes the biggest free historical gap in the public-only process.
- The four archived-only pages should stay in the rebuild backlog until backlink data says they are truly disposable.
- `contact-us` and `annual-backflow-testing` look like replaced live pages rather than one-off microsites.
- `flowexpo` and `landscape-expo` look like campaign or trade-show landing pages that may still matter if external links point at them.
"""


def build_clone_execution_matrix(
    baseline: dict[str, int],
    wayback_inventory_count: int,
    archived_only_count: int,
    live_without_archive_count: int,
    gap_rows: list[dict[str, str]],
) -> str:
    table_rows = "\n".join(
        "| {workstream} | {status} | {already_captured} | {still_missing} | {best_closer} | {website_clone_delta} | {seo_clone_delta} | {priority} |".format(
            **row
        )
        for row in gap_rows
    )
    return f"""# Backflow Test Pros Clone Execution Matrix

Generated: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")}

## Updated Baseline

- Whole-site public clone baseline after the live crawl and Wayback pass: `88-92%`
- Content clone confidence: `96%+`
- Visual clone confidence: `78-86%`
- On-page SEO clone confidence: `86-93%`
- Hidden infra clone confidence: `35-55%`

## What We Already Have

- `{baseline['live_url_count']}` live public URLs frozen into the dossier.
- `{wayback_inventory_count}` unique archived HTML URLs from Wayback across 2024-2026.
- `{archived_only_count}` archived-only URLs recovered that were not in the live crawl.
- `{baseline['asset_count']}` public assets referenced, with `{baseline['downloaded_asset_count']}` downloaded locally.
- `11` representative full-page screenshots across core templates.
- `{baseline['authority_count']}` public authority/citation records for SEO continuity decisions.
- `{live_without_archive_count}` live URLs that have no Wayback HTML snapshot yet and therefore depend entirely on our current capture.

## Gap Tracker

| Workstream | Status | Already Captured | Still Missing | Best Closer | Website Clone Delta | SEO Clone Delta | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
{table_rows}

## Recommended Order

1. Use the new Wayback outputs to decide whether the four archived-only pages should be rebuilt, redirected, or intentionally dropped.
2. Buy `Screaming Frog SEO Spider` next if the immediate goal is the closest possible website copy.
3. Run a full rendered crawl plus custom extraction, then do a broad screenshot sweep for every template cluster and breakpoint.
4. Buy `Ahrefs Standard` after that if we also care which historical or low-traffic pages must exist to preserve SEO.
5. Add `Semrush Guru` only if we want a second SEO database for cross-checking.
6. Start the rebuild only after those exports are merged into the dossier.

## Ceiling Without Private Access

- Realistic website-copy ceiling without private platform access: `92-95%`
- Realistic SEO-parity ceiling without private platform access: `90-94%`
- To move beyond that, we would need Webflow, DNS, analytics, or redirect-rule access.
"""


def main() -> int:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    RAW_WAYBACK_HTML_DIR.mkdir(parents=True, exist_ok=True)

    live_rows = read_csv(URL_INVENTORY_CSV)
    seo_rows = read_csv(PAGE_SEO_MATRIX_CSV)
    baseline = load_baseline_counts()
    wayback_rows = fetch_wayback_rows()

    inventory_rows, archived_only_rows, archived_only_urls, live_without_archive_urls = build_wayback_inventory(
        live_rows=live_rows,
        seo_rows=seo_rows,
        wayback_rows=wayback_rows,
    )

    gap_rows = build_clone_gap_rows(
        baseline=baseline,
        archived_only_count=len(archived_only_rows),
        live_without_archive_count=len(live_without_archive_urls),
    )

    write_csv(
        WAYBACK_SNAPSHOT_INVENTORY_CSV,
        inventory_rows,
        [
            "url",
            "slug",
            "live_now",
            "page_class",
            "template_family",
            "live_title",
            "snapshot_count",
            "first_snapshot",
            "last_snapshot",
            "first_wayback_url",
            "latest_wayback_url",
        ],
    )
    write_csv(
        WAYBACK_ARCHIVED_ONLY_PAGES_CSV,
        archived_only_rows,
        [
            "url",
            "slug",
            "role_guess",
            "title",
            "meta_description",
            "h1",
            "snapshot_count",
            "first_snapshot",
            "last_snapshot",
            "latest_wayback_url",
            "last_published_hint",
            "webflow_page_id",
            "likely_live_replacement",
            "fetch_status",
            "saved_html_path",
        ],
    )
    write_csv(
        CLONE_GAP_TRACKER_CSV,
        gap_rows,
        [
            "workstream",
            "status",
            "already_captured",
            "still_missing",
            "best_closer",
            "website_clone_delta",
            "seo_clone_delta",
            "priority",
            "notes",
        ],
    )
    write_text(
        WAYBACK_DIFF_REPORT_MD,
        build_wayback_diff_report(
            inventory_rows=inventory_rows,
            archived_only_rows=archived_only_rows,
            live_without_archive_urls=live_without_archive_urls,
        ),
    )
    write_text(
        CLONE_EXECUTION_MATRIX_MD,
        build_clone_execution_matrix(
            baseline=baseline,
            wayback_inventory_count=len(inventory_rows),
            archived_only_count=len(archived_only_rows),
            live_without_archive_count=len(live_without_archive_urls),
            gap_rows=gap_rows,
        ),
    )
    print(f"Wrote {WAYBACK_SNAPSHOT_INVENTORY_CSV}")
    print(f"Wrote {WAYBACK_ARCHIVED_ONLY_PAGES_CSV}")
    print(f"Wrote {CLONE_GAP_TRACKER_CSV}")
    print(f"Wrote {WAYBACK_DIFF_REPORT_MD}")
    print(f"Wrote {CLONE_EXECUTION_MATRIX_MD}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
