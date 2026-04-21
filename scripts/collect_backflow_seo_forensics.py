#!/usr/bin/env python3

from __future__ import annotations

import csv
import gzip
import json
import os
import re
import subprocess
import sys
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET


SITE_ROOT = "https://www.backflowtestpros.com"
SITE_DOMAIN = "www.backflowtestpros.com"
USER_AGENT = "Mozilla/5.0 (compatible; BackflowSEOForensics/1.0; +https://www.backflowtestpros.com)"

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_ROOT = ROOT / "output" / "backflowtestpros_forensics"
RAW_ROOT = OUTPUT_ROOT / "raw"
RAW_HTML_DIR = RAW_ROOT / "html"
RAW_SEARCH_DIR = RAW_ROOT / "search"
RAW_SCREENSHOT_DIR = RAW_ROOT / "screenshots"
RAW_ASSET_DIR = RAW_ROOT / "assets"

ROBOTS_PATH = RAW_ROOT / "robots.txt"
SITEMAP_PATH = RAW_ROOT / "sitemap.xml"
URL_INVENTORY_CSV = OUTPUT_ROOT / "url_inventory.csv"
PAGE_SEO_MATRIX_CSV = OUTPUT_ROOT / "page_seo_matrix.csv"
ASSET_MANIFEST_CSV = OUTPUT_ROOT / "asset_manifest.csv"
AUTHORITY_REGISTRY_CSV = OUTPUT_ROOT / "authority_registry.csv"
RECOVERY_GAP_REPORT_MD = OUTPUT_ROOT / "recovery_gap_report.md"

FIRECRAWL_BIN = os.environ.get("FIRECRAWL_BIN", "firecrawl")

REPRESENTATIVE_PATHS = [
    "/",
    "/about-us",
    "/backflow-testing",
    "/backflow-installation",
    "/backflow-repair-replacement-services",
    "/contact-backflowtestpros",
    "/privacy-policy",
    "/orange-county-water-district-backflow-regulations",
    "/orange-county/irvine-backflow-testing-repair",
    "/los-angeles-county-backflow-testing-installation-repair-service-areas",
    "/commercial-backflow-specialists/restaurant-food-services-backflow-testing-installation-repair-services",
]

SEARCH_QUERIES = [
    ("brand", '"Backflow Test Pros"'),
    ("domain_offsite", '"backflowtestpros.com" -site:backflowtestpros.com'),
    ("indexed_pages", "site:backflowtestpros.com"),
    ("oc_phone", '"(714) 852-1213" "Backflow Test Pros"'),
    ("la_phone", '"(310) 753-7325" "Backflow Test Pros"'),
    ("service_email", '"service@backflowtestpros.com"'),
    ("orange_address", '"2211 Michelson Dr" "Backflow Test Pros"'),
    ("la_address", '"1150 S Olive St" "Backflow Test Pros"'),
]

KNOWN_VARIANTS = [
    {
        "label": "master",
        "phone": "800-803-6658",
        "address": "",
        "terms": ["(800) 803-6658", "800-803-6658"],
    },
    {
        "label": "los_angeles_county",
        "phone": "310-753-7325",
        "address": "1150 S Olive St, 10th Floor, Los Angeles, CA 90015",
        "terms": ["1150 S Olive St", "Los Angeles, CA 90015", "(310) 753-7325", "310-753-7325"],
    },
    {
        "label": "orange_county",
        "phone": "714-852-1213",
        "address": "2211 Michelson Dr, 9th Floor, Irvine, CA 92612",
        "terms": ["2211 Michelson Dr", "Irvine, CA 92612", "(714) 852-1213", "714-852-1213"],
    },
    {
        "label": "san_diego_county",
        "phone": "619-415-6937",
        "address": "600 B Street, Suite 300, San Diego, CA 92101",
        "terms": ["600 B Street", "San Diego, CA 92101", "(619) 415-6937", "619-415-6937"],
    },
]

CLAIMABLE_DOMAINS = {
    "facebook.com",
    "instagram.com",
    "yelp.com",
    "bbb.org",
    "youtube.com",
    "apple.com",
    "bing.com",
    "google.com",
    "maps.apple.com",
    "mapquest.com",
    "merchantcircle.com",
    "local.yahoo.com",
    "quora.com",
}

GOVERNMENT_HINTS = (".gov", ".ca.gov")


def ensure_dirs() -> None:
    for path in [OUTPUT_ROOT, RAW_ROOT, RAW_HTML_DIR, RAW_SEARCH_DIR, RAW_SCREENSHOT_DIR, RAW_ASSET_DIR]:
        path.mkdir(parents=True, exist_ok=True)


def log(message: str) -> None:
    print(message, flush=True)


def normalize_url(url: str) -> str:
    if not url:
        return ""
    joined = urljoin(f"{SITE_ROOT}/", url)
    parsed = urlparse(joined)
    path = parsed.path or "/"
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    normalized = f"{parsed.scheme}://{parsed.netloc}{path}"
    if parsed.query:
        normalized = f"{normalized}?{parsed.query}"
    return normalized


def slugify_path(url: str) -> str:
    parsed = urlparse(normalize_url(url))
    path = parsed.path.strip("/")
    if not path:
        return "home"
    slug = path.replace("/", "__")
    slug = re.sub(r"[^a-zA-Z0-9._-]+", "-", slug)
    return slug[:180]


def request_url(url: str, timeout: int = 30) -> tuple[int, dict[str, str], bytes]:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(req, timeout=timeout) as response:
            headers = dict(response.headers.items())
            body = response.read()
            if headers.get("Content-Encoding", "").lower() == "gzip":
                body = gzip.decompress(body)
            return response.status, headers, body
    except HTTPError as exc:
        headers = dict(exc.headers.items())
        body = exc.read()
        if headers.get("Content-Encoding", "").lower() == "gzip":
            body = gzip.decompress(body)
        return exc.code, headers, body
    except URLError as exc:
        raise RuntimeError(f"URL error for {url}: {exc}") from exc


def fetch_text(url: str, timeout: int = 30) -> tuple[int, dict[str, str], str]:
    status, headers, body = request_url(url, timeout=timeout)
    encoding = "utf-8"
    content_type = headers.get("Content-Type", "")
    match = re.search(r"charset=([A-Za-z0-9._-]+)", content_type)
    if match:
        encoding = match.group(1)
    return status, headers, body.decode(encoding, errors="replace")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def parse_sitemap(xml_text: str) -> list[str]:
    root = ET.fromstring(xml_text)
    urls: list[str] = []
    for elem in root.iter():
        if elem.tag.endswith("loc") and elem.text:
            urls.append(normalize_url(elem.text.strip()))
    return urls


class PageParser(HTMLParser):
    def __init__(self, page_url: str) -> None:
        super().__init__(convert_charrefs=True)
        self.page_url = page_url
        self.title = ""
        self.meta_description = ""
        self.canonical = ""
        self.h1_texts: list[str] = []
        self.links: list[str] = []
        self.assets: list[str] = []
        self.tel_links: list[str] = []
        self.mailto_links: list[str] = []
        self.external_links: list[str] = []
        self.visible_text_parts: list[str] = []
        self.ld_json_blocks: list[str] = []
        self._capture_title = False
        self._capture_h1 = False
        self._capture_ld_json = False
        self._skip_visible_text = False
        self._title_parts: list[str] = []
        self._h1_parts: list[str] = []
        self._ld_json_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {k.lower(): (v or "") for k, v in attrs}
        href = attr.get("href", "").strip()
        src = attr.get("src", "").strip()
        rel = {part.lower() for part in attr.get("rel", "").split()}
        if tag == "title":
            self._capture_title = True
            self._title_parts = []
        elif tag == "h1":
            self._capture_h1 = True
            self._h1_parts = []
        elif tag == "script" and attr.get("type", "").lower() == "application/ld+json":
            self._capture_ld_json = True
            self._ld_json_parts = []
        elif tag in {"script", "style", "noscript"}:
            self._skip_visible_text = True

        if tag == "meta":
            name = attr.get("name", "").lower()
            prop = attr.get("property", "").lower()
            if name == "description" or prop == "og:description":
                if not self.meta_description:
                    self.meta_description = attr.get("content", "").strip()
        if tag == "link":
            if "canonical" in rel and href:
                self.canonical = normalize_url(href)
            if href and self._looks_like_asset_url(href):
                self.assets.append(urljoin(self.page_url, href))
        if tag == "a" and href:
            absolute = urljoin(self.page_url, href)
            self.links.append(absolute)
            if href.startswith("tel:"):
                self.tel_links.append(href.replace("tel:", "", 1))
            elif href.startswith("mailto:"):
                self.mailto_links.append(href.replace("mailto:", "", 1))
            else:
                if urlparse(absolute).netloc and urlparse(absolute).netloc != SITE_DOMAIN:
                    self.external_links.append(absolute)
        if tag in {"img", "script", "source", "iframe", "video", "audio"} and src:
            if self._looks_like_asset_url(src):
                self.assets.append(urljoin(self.page_url, src))
        if tag in {"img", "source"}:
            srcset = attr.get("srcset", "").strip()
            if srcset:
                for candidate in srcset.split(","):
                    item = candidate.strip().split(" ")[0]
                    if item and self._looks_like_asset_url(item):
                        self.assets.append(urljoin(self.page_url, item))

    def handle_endtag(self, tag: str) -> None:
        if tag == "title" and self._capture_title:
            self._capture_title = False
            self.title = " ".join("".join(self._title_parts).split())
        elif tag == "h1" and self._capture_h1:
            self._capture_h1 = False
            text = " ".join("".join(self._h1_parts).split())
            if text:
                self.h1_texts.append(text)
        elif tag == "script" and self._capture_ld_json:
            self._capture_ld_json = False
            payload = "".join(self._ld_json_parts).strip()
            if payload:
                self.ld_json_blocks.append(payload)
        elif tag in {"script", "style", "noscript"}:
            self._skip_visible_text = False

    def handle_data(self, data: str) -> None:
        if self._capture_title:
            self._title_parts.append(data)
        elif self._capture_h1:
            self._h1_parts.append(data)
        elif self._capture_ld_json:
            self._ld_json_parts.append(data)
        elif not self._skip_visible_text:
            text = " ".join(data.split())
            if text:
                self.visible_text_parts.append(text)

    @staticmethod
    def _looks_like_asset_url(url: str) -> bool:
        if not url or url.startswith(("mailto:", "tel:", "javascript:", "#")):
            return False
        if any(url.lower().endswith(ext) for ext in (
            ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif", ".ico",
            ".css", ".js", ".pdf", ".woff", ".woff2", ".ttf", ".eot", ".mp4",
            ".webm", ".mov", ".json"
        )):
            return True
        return "website-files.com" in url or "cloudfront.net" in url


@dataclass
class PageRecord:
    url: str
    slug: str
    path: str
    page_class: str
    template_family: str
    status_code: int
    content_type: str
    last_modified: str
    server: str
    title: str
    meta_description: str
    h1: str
    h1_count: int
    canonical: str
    schema_types: str
    word_count: int
    primary_keyword_intent: str
    cta_pattern: str
    phone_variants: str
    address_variants: str
    internal_outlinks: list[str]
    internal_inlinks: list[str]
    external_links: list[str]
    assets: list[str]
    weak_template_content: str


def classify_page(path: str) -> tuple[str, str]:
    clean = path.strip("/")
    if not clean:
        return "home", "homepage"
    if clean in {"about-us"}:
        return "company", "about_page"
    if clean in {"contact-backflowtestpros"}:
        return "utility_legal", "contact_page"
    if clean in {"privacy-policy"}:
        return "utility_legal", "legal_page"
    if "water-district-backflow-regulations" in clean:
        return "regulation_page", "regulation_page"
    if clean.startswith("commercial-backflow-specialists/"):
        return "commercial_vertical", "commercial_vertical"
    if clean.endswith("-service-areas"):
        return "county_hub", "service_area_hub"
    if clean.startswith(("orange-county/", "la-county/", "ventura-county/", "riverside-county/", "san-bernardino-county/", "san-diego-county/")):
        return "city_page", "county_city_landing"
    if clean.endswith("-backflow-testing-repair") or clean.endswith("-backflow-testing-and-repair"):
        return "county_hub", "county_service_hub"
    return "core_service", "core_service"


def infer_primary_intent(path: str, page_class: str) -> str:
    clean = path.strip("/")
    if not clean:
        return "brand + regional backflow testing, installation, and repair"
    if page_class == "regulation_page":
        return clean.replace("-", " ")
    if page_class == "commercial_vertical":
        return clean.split("/")[-1].replace("-", " ")
    if page_class == "city_page":
        return clean.split("/")[-1].replace("-", " ")
    if page_class == "county_hub":
        return clean.replace("-", " ")
    return clean.replace("-", " ")


def extract_schema_types(ld_json_blocks: Iterable[str]) -> list[str]:
    found: list[str] = []

    def collect(node: object) -> None:
        if isinstance(node, dict):
            if "@type" in node:
                value = node["@type"]
                if isinstance(value, list):
                    for item in value:
                        if isinstance(item, str):
                            found.append(item)
                elif isinstance(value, str):
                    found.append(value)
            for value in node.values():
                collect(value)
        elif isinstance(node, list):
            for item in node:
                collect(item)

    for block in ld_json_blocks:
        try:
            collect(json.loads(block))
            continue
        except Exception:
            pass
        found.extend(re.findall(r'"@type"\s*:\s*"([^"]+)"', block))

    deduped: list[str] = []
    for item in found:
        if item not in deduped:
            deduped.append(item)
    return deduped


def normalize_internal_links(page_url: str, links: Iterable[str]) -> list[str]:
    internal: list[str] = []
    for link in links:
        if link.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        parsed = urlparse(urljoin(page_url, link))
        if not parsed.netloc or parsed.netloc == SITE_DOMAIN:
            normalized = normalize_url(urljoin(page_url, link))
            if normalized not in internal:
                internal.append(normalized)
    return internal


def clean_external_links(links: Iterable[str]) -> list[str]:
    cleaned: list[str] = []
    for link in links:
        parsed = urlparse(link)
        if not parsed.scheme.startswith("http"):
            continue
        normalized = normalize_url(link)
        if normalized not in cleaned and urlparse(normalized).netloc != SITE_DOMAIN:
            cleaned.append(normalized)
    return cleaned


def extract_phone_variants(text: str, tel_links: Iterable[str]) -> list[str]:
    numbers = set()
    for tel in tel_links:
        digits = re.sub(r"\D", "", tel)
        if len(digits) >= 10:
            digits = digits[-10:]
            numbers.add(f"{digits[0:3]}-{digits[3:6]}-{digits[6:10]}")
    for match in re.findall(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text):
        digits = re.sub(r"\D", "", match)
        if len(digits) >= 10:
            digits = digits[-10:]
            numbers.add(f"{digits[0:3]}-{digits[3:6]}-{digits[6:10]}")
    return sorted(numbers)


def extract_address_variants(text: str) -> list[str]:
    found: list[str] = []
    for variant in KNOWN_VARIANTS:
        if any(term in text for term in variant["terms"]):
            found.append(variant["label"])
    return found


def infer_cta_pattern(text: str, internal_links: Iterable[str], tel_links: Iterable[str]) -> str:
    lowered = text.lower()
    signals = []
    if tel_links:
        signals.append("call_now")
    if any("/contact-backflowtestpros" in link for link in internal_links):
        signals.append("contact_form")
    if "schedule" in lowered:
        signals.append("schedule")
    if "pricing" in lowered:
        signals.append("pricing")
    if "repair coverage" in lowered:
        signals.append("repair_coverage")
    if "same day certification" in lowered or "same-day certification" in lowered:
        signals.append("same_day_certification")
    return "|".join(dict.fromkeys(signals))


def detect_weak_template_content(page_class: str, word_count: int, title: str, h1: str) -> str:
    if page_class in {"city_page", "commercial_vertical", "county_hub"} and word_count < 700:
        return "yes"
    if title and h1 and title.lower().replace("backflow test pros", "").strip() == h1.lower().strip():
        return "possible"
    return "no"


def parse_page(url: str, status_code: int, headers: dict[str, str], html_text: str) -> PageRecord:
    parser = PageParser(url)
    parser.feed(html_text)
    parsed = urlparse(url)
    page_class, template_family = classify_page(parsed.path)
    schema_types = extract_schema_types(parser.ld_json_blocks)
    visible_text = " ".join(parser.visible_text_parts)
    internal_links = normalize_internal_links(url, parser.links)
    external_links = clean_external_links(parser.external_links)
    assets = sorted(dict.fromkeys(urljoin(url, asset) for asset in parser.assets))
    phone_variants = extract_phone_variants(html_text, parser.tel_links)
    address_variants = extract_address_variants(html_text)
    h1 = parser.h1_texts[0] if parser.h1_texts else ""
    return PageRecord(
        url=url,
        slug=slugify_path(url),
        path=parsed.path or "/",
        page_class=page_class,
        template_family=template_family,
        status_code=status_code,
        content_type=headers.get("Content-Type", ""),
        last_modified=headers.get("Last-Modified", ""),
        server=headers.get("Server", ""),
        title=parser.title,
        meta_description=parser.meta_description,
        h1=h1,
        h1_count=len(parser.h1_texts),
        canonical=parser.canonical or normalize_url(url),
        schema_types="|".join(schema_types),
        word_count=len(re.findall(r"\w+", visible_text)),
        primary_keyword_intent=infer_primary_intent(parsed.path, page_class),
        cta_pattern=infer_cta_pattern(html_text, internal_links, parser.tel_links),
        phone_variants="|".join(phone_variants),
        address_variants="|".join(address_variants),
        internal_outlinks=internal_links,
        internal_inlinks=[],
        external_links=external_links,
        assets=assets,
        weak_template_content=detect_weak_template_content(page_class, len(re.findall(r"\w+", visible_text)), parser.title, h1),
    )


def fetch_site_text_file(path: str, destination: Path) -> str:
    url = urljoin(f"{SITE_ROOT}/", path.lstrip("/"))
    _, _, text = fetch_text(url)
    write_text(destination, text)
    return text


def fetch_and_store_page(url: str) -> tuple[str, PageRecord]:
    status, headers, html_text = fetch_text(url, timeout=30)
    write_text(RAW_HTML_DIR / f"{slugify_path(url)}.html", html_text)
    record = parse_page(url, status, headers, html_text)
    return url, record


def collect_pages(urls: list[str]) -> dict[str, PageRecord]:
    records: dict[str, PageRecord] = {}
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(fetch_and_store_page, url): url for url in urls}
        for future in as_completed(futures):
            url = futures[future]
            try:
                _, record = future.result()
                records[url] = record
                log(f"Fetched {url}")
            except Exception as exc:
                log(f"Failed {url}: {exc}")
    return records


def discover_additional_internal_urls(records: dict[str, PageRecord]) -> list[str]:
    known_urls = set(records)
    discovered = set()
    for record in records.values():
        for link in record.internal_outlinks:
            normalized = normalize_url(link)
            parsed = urlparse(normalized)
            if parsed.netloc != SITE_DOMAIN:
                continue
            if "?" in normalized:
                continue
            discovered.add(normalized)
    return sorted(discovered - known_urls)


def finalize_internal_links(records: dict[str, PageRecord]) -> None:
    inbound: defaultdict[str, list[str]] = defaultdict(list)
    known_urls = set(records)
    for url, record in records.items():
        filtered_outlinks = []
        for link in record.internal_outlinks:
            normalized = normalize_url(link)
            if normalized in known_urls and normalized not in filtered_outlinks:
                filtered_outlinks.append(normalized)
                inbound[normalized].append(url)
        record.internal_outlinks = filtered_outlinks
    for url, record in records.items():
        record.internal_inlinks = sorted(dict.fromkeys(inbound.get(url, [])))


def classify_asset_type(asset_url: str) -> str:
    path = urlparse(asset_url).path.lower()
    for suffix, label in {
        ".png": "image",
        ".jpg": "image",
        ".jpeg": "image",
        ".gif": "image",
        ".svg": "image",
        ".webp": "image",
        ".avif": "image",
        ".ico": "icon",
        ".css": "stylesheet",
        ".js": "script",
        ".pdf": "pdf",
        ".woff": "font",
        ".woff2": "font",
        ".ttf": "font",
        ".eot": "font",
        ".mp4": "video",
        ".webm": "video",
        ".mov": "video",
        ".json": "json",
    }.items():
        if path.endswith(suffix):
            return label
    return "asset"


def is_first_party_asset(asset_url: str) -> bool:
    host = urlparse(asset_url).netloc.lower()
    return (
        host == SITE_DOMAIN
        or host.endswith("website-files.com")
        or host.endswith("cloudfront.net")
    )


def safe_asset_destination(asset_url: str) -> Path:
    parsed = urlparse(asset_url)
    host = parsed.netloc.replace(":", "_")
    path = parsed.path.lstrip("/")
    if not path:
        path = "root"
    return RAW_ASSET_DIR / host / path


def download_asset(asset_url: str) -> tuple[str, str, str]:
    destination = safe_asset_destination(asset_url)
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        _, _, body = request_url(asset_url, timeout=45)
        destination.write_bytes(body)
        return asset_url, "yes", str(destination.relative_to(OUTPUT_ROOT))
    except Exception:
        return asset_url, "no", ""


def collect_asset_manifest(records: dict[str, PageRecord]) -> list[dict[str, str]]:
    aggregate: dict[str, dict[str, object]] = {}
    for url, record in records.items():
        for asset in record.assets:
            item = aggregate.setdefault(asset, {"pages": set(), "type": classify_asset_type(asset)})
            item["pages"].add(url)

    download_results: dict[str, tuple[str, str]] = {}
    first_party_assets = [asset for asset in aggregate if is_first_party_asset(asset)]
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(download_asset, asset): asset for asset in first_party_assets}
        for future in as_completed(futures):
            asset, downloaded, relative_path = future.result()
            download_results[asset] = (downloaded, relative_path)

    rows = []
    for asset_url in sorted(aggregate):
        pages = sorted(aggregate[asset_url]["pages"])
        downloaded, relative_path = download_results.get(asset_url, ("no", ""))
        rows.append(
            {
                "asset_url": asset_url,
                "asset_type": str(aggregate[asset_url]["type"]),
                "asset_host": urlparse(asset_url).netloc,
                "extension": Path(urlparse(asset_url).path).suffix.lower(),
                "source_page_count": str(len(pages)),
                "source_pages_sample": "|".join(pages[:5]),
                "first_party_asset": "yes" if is_first_party_asset(asset_url) else "no",
                "downloaded": downloaded,
                "download_path": relative_path,
            }
        )
    return rows


def run_firecrawl_search(name: str, query: str) -> dict[str, object]:
    output_path = RAW_SEARCH_DIR / f"{name}.json"
    cmd = [FIRECRAWL_BIN, "search", query, "--limit", "10", "--json", "-o", str(output_path)]
    subprocess.run(cmd, check=True)
    return json.loads(output_path.read_text(encoding="utf-8"))


def scrape_representative_page(url: str) -> dict[str, object] | None:
    slug = slugify_path(url)
    json_path = RAW_SCREENSHOT_DIR / f"{slug}.json"
    cmd = [
        FIRECRAWL_BIN,
        "scrape",
        url,
        "--screenshot",
        "--full-page-screenshot",
        "--json",
        "-o",
        str(json_path),
    ]
    try:
        subprocess.run(cmd, check=True)
    except Exception as exc:
        log(f"Firecrawl screenshot failed for {url}: {exc}")
        return None
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    screenshot_url = payload.get("screenshot")
    if isinstance(screenshot_url, str) and screenshot_url.startswith("http"):
        try:
            _, _, body = request_url(screenshot_url, timeout=60)
            screenshot_path = RAW_SCREENSHOT_DIR / f"{slug}.png"
            screenshot_path.write_bytes(body)
            payload["localScreenshotPath"] = str(screenshot_path.relative_to(OUTPUT_ROOT))
            write_json(json_path, payload)
        except Exception as exc:
            log(f"Screenshot download failed for {url}: {exc}")
    return payload


def fetch_authority_source(url: str) -> tuple[str, str, str]:
    try:
        status, headers, body = request_url(url, timeout=30)
        content_type = headers.get("Content-Type", "")
        if "html" in content_type:
            text = body.decode("utf-8", errors="replace")
        else:
            text = ""
        return str(status), content_type, text
    except Exception:
        return "", "", ""


def host_matches(host: str, domain: str) -> bool:
    host = host.lower().split(":")[0]
    domain = domain.lower()
    return host == domain or host.endswith(f".{domain}")


def extract_target_page(source_text: str, fallback_snippet: str) -> str:
    haystack = f"{source_text} {fallback_snippet}"
    matches = re.findall(r"https?://(?:www\.)?backflowtestpros\.com[^\s\"'<>)]*", haystack)
    if matches:
        cleaned = normalize_url(matches[0].rstrip(".,)"))
        return cleaned
    if "backflowtestpros.com" in haystack.lower():
        return SITE_ROOT
    return ""


def find_link_observation(source_html: str) -> tuple[str, str]:
    link_tags = re.findall(r"<a\b[^>]*href=[\"']([^\"']+backflowtestpros\.com[^\"']*)[\"'][^>]*>", source_html, flags=re.I)
    if not link_tags:
        if "backflowtestpros.com" in source_html.lower():
            return "brand_or_domain_mention", "unknown"
        return "not_observed", "unknown"

    anchor_match = re.search(
        r"<a\b([^>]*)href=[\"']([^\"']+backflowtestpros\.com[^\"']*)[\"']([^>]*)>",
        source_html,
        flags=re.I,
    )
    if not anchor_match:
        return "direct_website_link", "unknown"

    attrs = " ".join(part for part in anchor_match.groups() if part and "http" not in part)
    attrs_lower = attrs.lower()
    if "nofollow" in attrs_lower or "ugc" in attrs_lower or "sponsored" in attrs_lower:
        return "direct_website_link", "nofollow"
    return "direct_website_link", "yes"


def bucket_authority_candidate(source_url: str, source_html: str, content_type: str) -> str:
    parsed = urlparse(source_url)
    host = parsed.netloc.lower()
    if source_url.lower().endswith(".pdf") or any(host_matches(host, hint) for hint in GOVERNMENT_HINTS) or host.endswith(".gov"):
        return "government_regulatory_reference"
    if any(host_matches(host, domain) for domain in CLAIMABLE_DOMAINS):
        return "claimable_profile"
    observation, _ = find_link_observation(source_html)
    if observation == "direct_website_link":
        return "probable_true_backlink_needs_paid_confirmation"
    return "earned_mention"


def claim_recovery_path(bucket: str, source_url: str) -> str:
    host = urlparse(source_url).netloc.lower()
    if bucket == "claimable_profile":
        if "google.com" in host or "apple.com" in host or "bing.com" in host:
            return "Claim or update with business email and platform verification once domain and GBP control are available."
        return "Claim or update via brand email, official phone, or domain verification once access is consolidated."
    if bucket == "government_regulatory_reference":
        return "Request manual record update with issuing agency if business details change; do not expect direct account access."
    if bucket == "probable_true_backlink_needs_paid_confirmation":
        return "Verify live linking status in paid SEO tooling before outreach or preservation work."
    return "Monitor and request corrections or a live link if the mention becomes strategically important."


def collect_authority_registry(home_record: PageRecord) -> list[dict[str, str]]:
    search_payloads = {}
    for name, query in SEARCH_QUERIES:
        try:
            search_payloads[name] = run_firecrawl_search(name, query)
            log(f"Firecrawl search complete: {name}")
        except Exception as exc:
            log(f"Firecrawl search failed for {name}: {exc}")
            search_payloads[name] = {"success": False, "data": {"web": []}}

    seeded_sources = {}
    for link in home_record.external_links:
        host = urlparse(link).netloc.lower()
        if any(host_matches(host, domain) for domain in CLAIMABLE_DOMAINS):
            seeded_sources[normalize_url(link)] = {
                "title": host,
                "description": "Seeded from homepage public profile links.",
                "query": "homepage_source",
            }

    for name, payload in search_payloads.items():
        for item in payload.get("data", {}).get("web", []):
            url = normalize_url(item.get("url", ""))
            if not url:
                continue
            seeded_sources[url] = {
                "title": item.get("title", ""),
                "description": item.get("description", ""),
                "query": name,
            }

    rows: list[dict[str, str]] = []
    for source_url in sorted(seeded_sources):
        meta = seeded_sources[source_url]
        status_code, content_type, source_html = fetch_authority_source(source_url)
        bucket = bucket_authority_candidate(source_url, source_html, content_type)
        observation, dofollow = find_link_observation(source_html)
        target_page = extract_target_page(source_html, meta["description"])
        snippet = meta["description"]
        phones = extract_phone_variants(f"{snippet} {source_html[:2500]}", [])
        visible_variants = extract_address_variants(f"{snippet} {source_html[:4000]}")
        business_data_parts = []
        if phones:
            business_data_parts.append("phones=" + "|".join(phones))
        if visible_variants:
            business_data_parts.append("address_variants=" + "|".join(visible_variants))
        if "service@backflowtestpros.com" in f"{snippet} {source_html}":
            business_data_parts.append("email=service@backflowtestpros.com")

        rows.append(
            {
                "bucket": bucket,
                "source_url": source_url,
                "source_domain": urlparse(source_url).netloc,
                "source_title": meta["title"],
                "source_snippet": snippet,
                "anchor_or_brand_text": "Backflow Test Pros",
                "target_page": target_page,
                "link_observation": observation,
                "dofollow_observable": dofollow,
                "business_data_shown": "; ".join(business_data_parts),
                "claim_recovery_path": claim_recovery_path(bucket, source_url),
                "discovered_via": meta["query"],
                "status_code": status_code,
                "content_type": content_type,
            }
        )

    deduped: list[dict[str, str]] = []
    seen = set()
    for row in rows:
        key = (row["source_url"], row["bucket"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)
    return deduped


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def build_inventory_rows(records: dict[str, PageRecord]) -> list[dict[str, object]]:
    rows = []
    for url in sorted(records):
        record = records[url]
        path_parts = [part for part in record.path.strip("/").split("/") if part]
        rows.append(
            {
                "url": record.url,
                "slug": record.slug,
                "path": record.path,
                "depth": len(path_parts),
                "page_class": record.page_class,
                "template_family": record.template_family,
                "path_segment_1": path_parts[0] if path_parts else "",
                "path_segment_2": path_parts[1] if len(path_parts) > 1 else "",
                "status_code": record.status_code,
                "content_type": record.content_type,
                "last_modified": record.last_modified,
                "server": record.server,
                "title": record.title,
                "canonical": record.canonical,
            }
        )
    return rows


def build_seo_rows(records: dict[str, PageRecord]) -> list[dict[str, object]]:
    rows = []
    for url in sorted(records):
        record = records[url]
        rows.append(
            {
                "url": record.url,
                "slug": record.slug,
                "page_class": record.page_class,
                "template_family": record.template_family,
                "title": record.title,
                "meta_description": record.meta_description,
                "h1": record.h1,
                "h1_count": record.h1_count,
                "canonical": record.canonical,
                "schema_types": record.schema_types,
                "word_count": record.word_count,
                "primary_keyword_intent": record.primary_keyword_intent,
                "cta_pattern": record.cta_pattern,
                "phone_variants": record.phone_variants,
                "address_variants": record.address_variants,
                "internal_outlink_count": len(record.internal_outlinks),
                "internal_outlinks_sample": "|".join(record.internal_outlinks[:8]),
                "internal_inlink_count": len(record.internal_inlinks),
                "internal_inlinks_sample": "|".join(record.internal_inlinks[:8]),
                "external_link_count": len(record.external_links),
                "external_links_sample": "|".join(record.external_links[:8]),
                "asset_ref_count": len(record.assets),
                "asset_refs_sample": "|".join(record.assets[:8]),
                "weak_template_content": record.weak_template_content,
            }
        )
    return rows


def build_recovery_report(
    sitemap_urls: list[str],
    records: dict[str, PageRecord],
    asset_rows: list[dict[str, str]],
    authority_rows: list[dict[str, str]],
    screenshot_count: int,
    site_index_results: int,
) -> str:
    page_class_counts = Counter(record.page_class for record in records.values())
    template_counts = Counter(record.template_family for record in records.values())
    authority_counts = Counter(row["bucket"] for row in authority_rows)
    downloadable_assets = sum(1 for row in asset_rows if row["downloaded"] == "yes")

    recovery_rows = [
        (
            "Domain / DNS",
            "Canonical domain live and crawlable at https://www.backflowtestpros.com",
            "Reclaim registrar/DNS access, preserve current slugs, then repoint once replacement is ready.",
            "No registrar or DNS control visible from public sources.",
        ),
        (
            "Google Search Console",
            "Homepage exposes google-site-verification token `h6v9guBLRlJ9K-MNFijues3CYx8NjXSJegwuMa3etrQ`.",
            "Verify with domain or DNS once control is available; compare ownership history after access is restored.",
            "Current GSC property and query data are private.",
        ),
        (
            "GA4",
            "Homepage loads GA4 property `G-KV93895VQ5`.",
            "Request admin transfer if possible; otherwise stand up a new GA4 property and annotate cutover.",
            "Historical analytics and conversions are private.",
        ),
        (
            "Webflow",
            "Homepage source exposes Webflow site id `67bfdff7943122ff2def874b` and page id `67e466bfa1c825b3fc8dc779`.",
            "Rebuild under a client-controlled Webflow workspace or export-equivalent stack before DNS cutover.",
            "Workspace access and CMS/project settings are private.",
        ),
        (
            "Google Business Profile",
            "Homepage links to Google Maps listings for LA and OC offices.",
            "Claim or transfer via business email, postcard/phone verification, and supporting business documentation.",
            "Current profile ownership is private.",
        ),
        (
            "Bing Places / Apple Business Connect",
            "Homepage links to Bing Maps and Apple Maps listings.",
            "Claim with business phone/email and keep NAP consistent with rebuilt site.",
            "Listing management access is private.",
        ),
        (
            "Facebook / YouTube / Instagram / Yelp / BBB / Quora",
            "Public profiles are visible in source and search results.",
            "Recover or claim each profile using business email, domain control, and official documentation.",
            "Actual account credentials are private.",
        ),
    ]

    sample_sources = [
        row["source_url"]
        for row in authority_rows
        if row["bucket"] in {
            "claimable_profile",
            "earned_mention",
            "government_regulatory_reference",
            "probable_true_backlink_needs_paid_confirmation",
        }
    ][:8]

    lines = [
        "# Backflow Test Pros Public Forensics Dossier",
        "",
        f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%SZ')}",
        "",
        "## Snapshot Summary",
        "",
        f"- Public sitemap URLs captured: {len(sitemap_urls)}",
        f"- HTML pages fetched successfully: {len(records)}",
        f"- Representative full-page screenshots captured: {screenshot_count}",
        f"- Unique public assets referenced: {len(asset_rows)}",
        f"- First-party/Webflow assets downloaded: {downloadable_assets}",
        f"- Authority registry entries: {len(authority_rows)}",
        f"- Search-indexed pages observed via Firecrawl `site:` query: {site_index_results}",
        "",
        "## Key Technical Signals",
        "",
        "- Hosting/application stack: Webflow site behind Cloudflare.",
        "- Observed GA4 property: `G-KV93895VQ5`.",
        "- Observed Google site verification token: `h6v9guBLRlJ9K-MNFijues3CYx8NjXSJegwuMa3etrQ`.",
        "- Observed Webflow site id: `67bfdff7943122ff2def874b`.",
        "- Observed Webflow homepage id: `67e466bfa1c825b3fc8dc779`.",
        "- Canonical pattern appears consistent with direct page URLs and no trailing slash on non-root pages.",
        "",
        "## Page Footprint",
        "",
    ]

    for key, count in sorted(page_class_counts.items()):
        lines.append(f"- `{key}`: {count}")

    lines.extend([
        "",
        "## Template Families",
        "",
    ])

    for key, count in sorted(template_counts.items()):
        lines.append(f"- `{key}`: {count}")

    lines.extend([
        "",
        "## Authority Registry Summary",
        "",
    ])

    for key, count in sorted(authority_counts.items()):
        lines.append(f"- `{key}`: {count}")

    if sample_sources:
        lines.extend([
            "",
            "Notable public sources:",
            "",
        ])
        for source in sample_sources:
            lines.append(f"- {source}")

    lines.extend([
        "",
        "## What Is Cloneable Right Now",
        "",
        "- Full public URL inventory from `robots.txt`, `sitemap.xml`, and live internal links.",
        "- Public HTML, titles, descriptions, canonicals, JSON-LD/schema, CTA patterns, phone/address variants, and internal-link relationships.",
        "- Public asset library referenced from live pages, including Webflow CDN images, CSS, JS, and icons.",
        "- Public profile and citation surface across business directories, maps, social profiles, and government/trade references.",
        "",
        "## What Is Not Cloneable Without Private Access",
        "",
        "- Historical Google Search Console queries, clicks, impressions, and crawl data.",
        "- Historical GA4 traffic, conversion events, audiences, and attribution setup.",
        "- Webflow CMS collections, backups, workspace settings, form submissions, and publishing controls.",
        "- Registrar/DNS records, SSL settings, and any non-public redirects or edge rules.",
        "- Full backlink completeness and anchor-text history without paid SEO tooling or platform access.",
        "",
        "## Recovery Matrix",
        "",
        "| Surface | Public evidence | Recovery path | Current blocker |",
        "| --- | --- | --- | --- |",
    ])

    for surface, evidence, path, blocker in recovery_rows:
        lines.append(f"| {surface} | {evidence} | {path} | {blocker} |")

    lines.extend([
        "",
        "## Recommended Next Actions",
        "",
        "- Preserve the exact slug structure, canonical relationships, and local landing-page coverage when rebuilding.",
        "- Claim domain, DNS, GSC, GA4, GBP, Webflow, and profile access in that order once client credentials are available.",
        "- Use `authority_registry.csv` to prioritize claimable profiles first, then government/manual updates, then backlink confirmation in paid SEO tools.",
        "- Treat `page_seo_matrix.csv` as the implementation blueprint for the literal clone pass before any content cleanup.",
    ])

    return "\n".join(lines) + "\n"


def main() -> int:
    ensure_dirs()

    log("Fetching robots.txt and sitemap.xml")
    robots_text = fetch_site_text_file("/robots.txt", ROBOTS_PATH)
    sitemap_text = fetch_site_text_file("/sitemap.xml", SITEMAP_PATH)

    sitemap_urls = parse_sitemap(sitemap_text)
    sitemap_urls = sorted(dict.fromkeys(normalize_url(url) for url in [*sitemap_urls, SITE_ROOT]))

    log(f"Parsed {len(sitemap_urls)} sitemap URLs")

    log("Fetching live HTML for all sitemap URLs")
    records = collect_pages(sitemap_urls)
    extra_urls = discover_additional_internal_urls(records)
    if extra_urls:
        log(f"Fetching {len(extra_urls)} additional internal URLs discovered from live navigation/footer links")
        records.update(collect_pages(extra_urls))
    finalize_internal_links(records)

    log("Building asset manifest and downloading first-party assets")
    asset_rows = collect_asset_manifest(records)

    log("Running Firecrawl screenshots for representative pages")
    screenshot_payloads = []
    for path in REPRESENTATIVE_PATHS:
        url = normalize_url(urljoin(f"{SITE_ROOT}/", path.lstrip("/")))
        if url not in records:
            continue
        payload = scrape_representative_page(url)
        if payload:
            screenshot_payloads.append(payload)
            time.sleep(0.5)

    log("Collecting authority registry")
    home_record = records.get(normalize_url(SITE_ROOT)) or next(iter(records.values()))
    authority_rows = collect_authority_registry(home_record)

    inventory_rows = build_inventory_rows(records)
    seo_rows = build_seo_rows(records)

    write_csv(
        URL_INVENTORY_CSV,
        inventory_rows,
        [
            "url",
            "slug",
            "path",
            "depth",
            "page_class",
            "template_family",
            "path_segment_1",
            "path_segment_2",
            "status_code",
            "content_type",
            "last_modified",
            "server",
            "title",
            "canonical",
        ],
    )

    write_csv(
        PAGE_SEO_MATRIX_CSV,
        seo_rows,
        [
            "url",
            "slug",
            "page_class",
            "template_family",
            "title",
            "meta_description",
            "h1",
            "h1_count",
            "canonical",
            "schema_types",
            "word_count",
            "primary_keyword_intent",
            "cta_pattern",
            "phone_variants",
            "address_variants",
            "internal_outlink_count",
            "internal_outlinks_sample",
            "internal_inlink_count",
            "internal_inlinks_sample",
            "external_link_count",
            "external_links_sample",
            "asset_ref_count",
            "asset_refs_sample",
            "weak_template_content",
        ],
    )

    write_csv(
        ASSET_MANIFEST_CSV,
        asset_rows,
        [
            "asset_url",
            "asset_type",
            "asset_host",
            "extension",
            "source_page_count",
            "source_pages_sample",
            "first_party_asset",
            "downloaded",
            "download_path",
        ],
    )

    write_csv(
        AUTHORITY_REGISTRY_CSV,
        authority_rows,
        [
            "bucket",
            "source_url",
            "source_domain",
            "source_title",
            "source_snippet",
            "anchor_or_brand_text",
            "target_page",
            "link_observation",
            "dofollow_observable",
            "business_data_shown",
            "claim_recovery_path",
            "discovered_via",
            "status_code",
            "content_type",
        ],
    )

    indexed_results = 0
    indexed_results_path = RAW_SEARCH_DIR / "indexed_pages.json"
    if indexed_results_path.exists():
        payload = json.loads(indexed_results_path.read_text(encoding="utf-8"))
        indexed_results = len(payload.get("data", {}).get("web", []))

    report = build_recovery_report(
        sitemap_urls=sitemap_urls,
        records=records,
        asset_rows=asset_rows,
        authority_rows=authority_rows,
        screenshot_count=len(screenshot_payloads),
        site_index_results=indexed_results,
    )
    write_text(RECOVERY_GAP_REPORT_MD, report)

    log(f"Wrote {URL_INVENTORY_CSV}")
    log(f"Wrote {PAGE_SEO_MATRIX_CSV}")
    log(f"Wrote {ASSET_MANIFEST_CSV}")
    log(f"Wrote {AUTHORITY_REGISTRY_CSV}")
    log(f"Wrote {RECOVERY_GAP_REPORT_MD}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
