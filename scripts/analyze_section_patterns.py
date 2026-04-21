#!/usr/bin/env python3

from __future__ import annotations

import csv
import sys
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.collect_backflow_seo_forensics import OUTPUT_ROOT, write_csv, write_text


URL_INVENTORY_CSV = OUTPUT_ROOT / "url_inventory.csv"
PAGE_HEADING_MAP_CSV = OUTPUT_ROOT / "page_heading_map.csv"
SECTION_HEADING_INVENTORY_CSV = OUTPUT_ROOT / "section_heading_inventory.csv"
SECTION_PATTERN_REPORT_MD = OUTPUT_ROOT / "section_pattern_report.md"


class HeadingParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.current_tag: str | None = None
        self.buffer: list[str] = []
        self.headings: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"h1", "h2", "h3"}:
            self.current_tag = tag
            self.buffer = []
        elif self.current_tag and tag == "br":
            self.buffer.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if self.current_tag == tag:
            text = " ".join("".join(self.buffer).split())
            if text:
                self.headings.append((tag, text))
            self.current_tag = None
            self.buffer = []

    def handle_data(self, data: str) -> None:
        if self.current_tag:
            self.buffer.append(data)


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def build_outputs() -> tuple[list[dict[str, str]], list[dict[str, str]], str]:
    rows = read_csv(URL_INVENTORY_CSV)
    page_heading_rows: list[dict[str, str]] = []
    heading_counts: Counter[tuple[str, str]] = Counter()
    heading_pages: defaultdict[tuple[str, str], list[str]] = defaultdict(list)
    template_examples: defaultdict[str, list[dict[str, str]]] = defaultdict(list)

    for row in rows:
        html_path = OUTPUT_ROOT / "raw" / "html" / f"{row['slug']}.html"
        if not html_path.exists():
            continue
        parser = HeadingParser()
        parser.feed(html_path.read_text(encoding="utf-8"))
        h1s = [text for tag, text in parser.headings if tag == "h1"]
        h2s = [text for tag, text in parser.headings if tag == "h2"]
        h3s = [text for tag, text in parser.headings if tag == "h3"]

        page_heading_rows.append(
            {
                "url": row["url"],
                "slug": row["slug"],
                "page_class": row["page_class"],
                "template_family": row["template_family"],
                "h1s": " | ".join(h1s),
                "h2s": " | ".join(h2s),
                "h3s": " | ".join(h3s),
                "heading_count": str(len(parser.headings)),
            }
        )

        for tag, text in set(parser.headings):
            heading_counts[(tag, text)] += 1
            heading_pages[(tag, text)].append(row["url"])

        examples = template_examples[row["template_family"]]
        if len(examples) < 3:
            examples.append(
                {
                    "url": row["url"],
                    "h1s": " | ".join(h1s),
                    "h2s": " | ".join(h2s[:8]),
                    "h3s": " | ".join(h3s[:8]),
                }
            )

    section_heading_rows: list[dict[str, str]] = []
    for (tag, text), count in heading_counts.most_common():
        sample_urls = heading_pages[(tag, text)][:5]
        section_heading_rows.append(
            {
                "heading_tag": tag,
                "heading_text": text,
                "occurrence_count": str(count),
                "sample_urls": " | ".join(sample_urls),
            }
        )

    report_lines = [
        "# Backflow Test Pros Section Pattern Report",
        "",
        "This report turns recurring on-page sections into explicit rebuild guidance.",
        "",
        "## What This Confirms",
        "",
        "- The site is not just a URL clone problem. It is a repeated section/module system.",
        "- Core service pages use stable recurring blocks like pricing, compliance guides, regulations, and service-area lists.",
        "- City pages use a different recurring module set: pricing, compliance-risk copy, regulations, and local service-area blocks.",
        "- Service-area hubs use a lighter shared pattern focused on promo language plus long city-link lists.",
        "",
        "## Core Service Page Examples",
        "",
    ]

    for template_family in [
        "core_service",
        "county_city_landing",
        "service_area_hub",
        "commercial_vertical",
    ]:
        examples = template_examples.get(template_family, [])
        if not examples:
            continue
        report_lines.append(f"### `{template_family}`")
        report_lines.append("")
        for example in examples:
            report_lines.append(f"- `{example['url']}`")
            report_lines.append(f"  H1: `{example['h1s']}`")
            if example["h2s"]:
                report_lines.append(f"  H2: `{example['h2s']}`")
            if example["h3s"]:
                report_lines.append(f"  H3: `{example['h3s']}`")
        report_lines.append("")

    report_lines.extend(
        [
            "## Key Recurring Section Signals",
            "",
            "- `Backflow Preventer Installation Compliance Guide` is explicitly present in the captured installation page HTML.",
            "- `Backflow Prevention Testing Compliance Guide` is explicitly present in the captured testing page HTML.",
            "- Repair pages use a similar long-form explainer pattern, but with repair/replacement overview and FAQ blocks instead of the installation compliance guide tabs.",
            "- City pages commonly repeat local pricing, compliance-risk, regulations, and local service-area sections rather than the exact core-service headings.",
            "",
            "## Rebuild Implication",
            "",
            "- Yes, these main-page sections should be treated as reusable modules in the rebuild.",
            "- No, we should not rebuild those sections ad hoc page-by-page.",
            "- The right system is: template family -> ordered sections -> page data injected into those sections.",
        ]
    )

    return page_heading_rows, section_heading_rows, "\n".join(report_lines) + "\n"


def main() -> int:
    page_heading_rows, section_heading_rows, report = build_outputs()
    write_csv(
        PAGE_HEADING_MAP_CSV,
        page_heading_rows,
        ["url", "slug", "page_class", "template_family", "h1s", "h2s", "h3s", "heading_count"],
    )
    write_csv(
        SECTION_HEADING_INVENTORY_CSV,
        section_heading_rows,
        ["heading_tag", "heading_text", "occurrence_count", "sample_urls"],
    )
    write_text(SECTION_PATTERN_REPORT_MD, report)
    print(f"Wrote {PAGE_HEADING_MAP_CSV}")
    print(f"Wrote {SECTION_HEADING_INVENTORY_CSV}")
    print(f"Wrote {SECTION_PATTERN_REPORT_MD}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
