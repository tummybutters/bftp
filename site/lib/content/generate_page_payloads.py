#!/usr/bin/env python3

from __future__ import annotations

import csv
import json
import re
from collections import Counter
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


PROJECT_ROOT = Path(__file__).resolve().parents[3]
FORENSICS_ROOT = PROJECT_ROOT / "output" / "backflowtestpros_forensics"
HTML_ROOT = FORENSICS_ROOT / "raw" / "html"
OUTPUT_ROOT = PROJECT_ROOT / "site" / "data" / "generated"

URL_INVENTORY_CSV = FORENSICS_ROOT / "url_inventory.csv"
PAGE_SEO_MATRIX_CSV = FORENSICS_ROOT / "page_seo_matrix.csv"
PAGE_HEADING_MAP_CSV = FORENSICS_ROOT / "page_heading_map.csv"
WAYBACK_ARCHIVED_ONLY_PAGES_CSV = FORENSICS_ROOT / "wayback_archived_only_pages.csv"

SITE_HOST = "www.backflowtestpros.com"
COUNTY_NAMES = {
    "la-county": "Los Angeles County",
    "orange-county": "Orange County",
    "san-diego": "San Diego County",
    "san-bernardino-county": "San Bernardino County",
    "riverside-county": "Riverside County",
    "ventura-county": "Ventura County",
}
SPECIAL_COUNTY_PREFIXES = {
    "los-angeles-county": "la-county",
    "orange-county": "orange-county",
    "san-diego-county": "san-diego",
    "san-bernardino-county": "san-bernardino-county",
    "riverside-county": "riverside-county",
    "ventura-county": "ventura-county",
}
CITY_PAGE_PREFIXES = set(COUNTY_NAMES)
MODELED_FAMILIES = {
    "homepage",
    "about_page",
    "contact_page",
    "core_service",
    "county_city_landing",
    "service_area_hub",
    "commercial_vertical",
    "county_service_hub",
    "regulation_page",
    "legal_page",
}
IGNORED_BODY_DIV_CLASS_FRAGMENTS = (
    "dark-top-bar",
    "navbar",
    "w-nav",
    "w-embed",
)
VOID_TAGS = {
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
}

KNOWN_PAGE_ANOMALIES: dict[str, list[dict[str, str]]] = {
    "orange-county__rancho-santa-margarita-backflow-testing-installation-repair": [
        {
            "code": "locality_drift_neighborhoods",
            "severity": "high",
            "detail": "Neighborhood/service-area copy drifts into Carlsbad neighborhoods instead of Rancho Santa Margarita.",
        }
    ],
    "orange-county__mission-viejo-backflow-testing-repair": [
        {
            "code": "locality_drift_regulations",
            "severity": "medium",
            "detail": "Regulations copy injects Tustin-specific requirements mid-section.",
        }
    ],
    "la-county__alhambra-backflow-testing-repair": [
        {
            "code": "heading_typo",
            "severity": "low",
            "detail": "One H2 preserves the live typo 'Intallation'.",
        }
    ],
    "backflow-testing-faqs": [
        {
            "code": "faq_copy_typos",
            "severity": "low",
            "detail": "FAQ copy preserves visible spelling issues such as 'differnt'.",
        }
    ],
    "backflow-installation-faqs": [
        {
            "code": "promo_copy_typos",
            "severity": "low",
            "detail": "Promo copy preserves the visible typo 'installationn technicians'.",
        }
    ],
}

TYPO_PATTERNS = [
    (re.compile(r"\bintallation\b", re.I), "visible_typo_intallation"),
    (re.compile(r"\bregualatory\b", re.I), "visible_typo_regualatory"),
    (re.compile(r"\bdiffernt\b", re.I), "visible_typo_differnt"),
    (re.compile(r"\binstallationn\b", re.I), "visible_typo_installationn"),
]

ARCHIVED_PAGE_DECISIONS = {
    "annual-backflow-testing": {
        "decision": "redirect",
        "target": "/backflow-testing",
        "reason": "Wayback HTML is effectively the older testing service page and already has a clear live replacement.",
    },
    "contact-us": {
        "decision": "redirect",
        "target": "/contact-backflowtestpros",
        "reason": "Historical contact page has a direct live replacement with the same job-to-be-done.",
    },
    "flowexpo": {
        "decision": "defer_campaign_lander",
        "target": "",
        "reason": "Trade-show registration page looks campaign-specific; keep out of round-one rebuild unless backlink or paid-media continuity requires it.",
    },
    "landscape-expo": {
        "decision": "defer_campaign_lander",
        "target": "",
        "reason": "Partner offer page appears to be a time-bound campaign asset rather than a core evergreen page.",
    },
}


class Node:
    def __init__(self, tag: str, attrs: list[tuple[str, str | None]] | None = None, parent: "Node | None" = None) -> None:
        self.tag = tag
        self.attrs = {key: value or "" for key, value in (attrs or [])}
        self.parent = parent
        self.children: list[Node | str] = []

    def append(self, child: "Node | str") -> None:
        self.children.append(child)


class DOMParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Node(tag, attrs, self.stack[-1])
        self.stack[-1].append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.stack[-1].append(Node(tag, attrs, self.stack[-1]))

    def handle_endtag(self, tag: str) -> None:
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                self.stack = self.stack[:index]
                break

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.stack[-1].append(data)


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def compact(value: str) -> str:
    return " ".join(value.split())


def split_pipe(value: str) -> list[str]:
    if not value:
        return []
    return [part.strip() for part in value.split("|") if part.strip()]


def class_attr(node: Node) -> str:
    return node.attrs.get("class", "")


def node_text(node: Node | str) -> str:
    parts: list[str] = []

    def walk(current: Node | str) -> None:
        if isinstance(current, str):
            parts.append(current)
            return
        if current.tag == "br":
            parts.append(" ")
        for child in current.children:
            walk(child)

    walk(node)
    return compact("".join(parts))


def find_all(node: Node, predicate: Any) -> list[Node]:
    matches: list[Node] = []

    def walk(current: Node | str) -> None:
        if isinstance(current, str):
            return
        if predicate(current):
            matches.append(current)
        for child in current.children:
            walk(child)

    walk(node)
    return matches


def find_first(node: Node, predicate: Any) -> Node | None:
    for match in find_all(node, predicate):
        return match
    return None


def body_node(root: Node) -> Node | None:
    return find_first(root, lambda current: current.tag == "body")


def top_level_content_blocks(root: Node) -> list[Node]:
    body = body_node(root)
    if not body:
        return []
    blocks: list[Node] = []
    for child in body.children:
        if isinstance(child, str):
            continue
        if child.tag == "section":
            blocks.append(child)
            continue
        if child.tag != "div":
            continue
        child_class = class_attr(child)
        if not child_class:
            continue
        if any(fragment in child_class for fragment in IGNORED_BODY_DIV_CLASS_FRAGMENTS):
            continue
        blocks.append(child)
    return blocks


def first_heading(section: Node) -> str:
    heading = find_first(section, lambda current: current.tag in {"h1", "h2", "h3", "h4"})
    return node_text(heading) if heading else ""


def paragraph_texts(section: Node) -> list[str]:
    return [node_text(node) for node in find_all(section, lambda current: current.tag == "p") if node_text(node)]


def section_body(section: Node, heading: str = "") -> str:
    paragraphs = paragraph_texts(section)
    if paragraphs:
        return "\n\n".join(paragraphs)
    text = node_text(section)
    if heading and text.startswith(heading):
        return text[len(heading) :].strip()
    return text


def normalize_href(href: str) -> str:
    href = href.strip()
    if not href:
        return ""
    if href.startswith("https://") or href.startswith("http://") or href.startswith("#") or href.startswith("tel:") or href.startswith("mailto:"):
        return href
    if href.startswith("/"):
        return href
    return f"/{href.lstrip('/')}"


def is_external_href(href: str) -> bool:
    if href.startswith("http://") or href.startswith("https://"):
        return SITE_HOST not in href
    return False


def absolute_url_from_href(href: str) -> str:
    normalized = normalize_href(href)
    if normalized.startswith("http://") or normalized.startswith("https://"):
        return normalized
    if normalized.startswith("/"):
        return f"https://{SITE_HOST}{normalized}"
    return normalized


def path_from_url(url: str) -> str:
    if not url:
        return ""
    parsed = urlparse(url)
    if parsed.scheme and parsed.netloc:
        return parsed.path or "/"
    return normalize_href(url)


def unique(items: list[dict[str, Any]], key_fields: tuple[str, ...]) -> list[dict[str, Any]]:
    seen: set[tuple[Any, ...]] = set()
    deduped: list[dict[str, Any]] = []
    for item in items:
        key = tuple(item.get(field) for field in key_fields)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


def extract_links(section: Node, *, include_hash: bool = False, include_tel: bool = False) -> list[dict[str, Any]]:
    links: list[dict[str, Any]] = []
    for anchor in find_all(section, lambda current: current.tag == "a"):
        href = normalize_href(anchor.attrs.get("href", ""))
        if not href:
            continue
        if href.startswith("#") and not include_hash:
            continue
        if href.startswith("tel:") and not include_tel:
            continue
        if href.startswith("mailto:"):
            continue
        label = node_text(anchor)
        if not label and href.startswith("tel:"):
            label = href.replace("tel:", "")
        if not label:
            continue
        links.append(
            {
                "label": label,
                "href": href,
                "external": is_external_href(href),
                "target": anchor.attrs.get("target", ""),
            }
        )
    return unique(links, ("label", "href"))


def extract_list_items(section: Node) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for li in find_all(section, lambda current: current.tag == "li"):
        anchor = find_first(li, lambda current: current.tag == "a")
        if anchor:
            href = normalize_href(anchor.attrs.get("href", ""))
            label = node_text(anchor)
            if label:
                items.append(
                    {
                        "label": label,
                        "href": href,
                        "external": is_external_href(href),
                        "target": anchor.attrs.get("target", ""),
                    }
                )
            continue
        label = node_text(li)
        if label:
            items.append({"label": label, "href": "", "external": False, "target": ""})
    return unique(items, ("label", "href"))


def extract_images(section: Node) -> list[dict[str, str]]:
    images: list[dict[str, str]] = []
    for image in find_all(section, lambda current: current.tag == "img"):
        src = image.attrs.get("src", "").strip()
        if not src:
            continue
        images.append({"src": src, "alt": compact(image.attrs.get("alt", ""))})
    return unique(images, ("src",))


def extract_logos(section: Node) -> list[dict[str, str]]:
    return extract_images(section)


def extract_map(section: Node) -> dict[str, Any] | None:
    map_node = find_first(section, lambda current: "w-widget-map" in class_attr(current))
    if not map_node:
        return None
    latlng = map_node.attrs.get("data-widget-latlng", "")
    latitude = None
    longitude = None
    if "," in latlng:
        lat_text, lng_text = latlng.split(",", 1)
        try:
            latitude = float(lat_text.strip())
            longitude = float(lng_text.strip())
        except ValueError:
            latitude = None
            longitude = None
    return {
        "title": map_node.attrs.get("title", "") or map_node.attrs.get("aria-label", ""),
        "latitude": latitude,
        "longitude": longitude,
        "zoom": map_node.attrs.get("data-widget-zoom", ""),
        "tooltip": compact(map_node.attrs.get("data-widget-tooltip", "")),
    }


def extract_feature_cards(section: Node) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    for card in find_all(section, lambda current: class_attr(current) == "rt-about-blog-card-2"):
        title_node = find_first(
            card,
            lambda current: current.tag in {"h3", "h4", "h5", "h6"}
            or "heading" in class_attr(current)
            or "text" in class_attr(current),
        )
        body_node_match = find_first(card, lambda current: current.tag == "p" or "paragraph" in class_attr(current))
        image_node = find_first(card, lambda current: current.tag == "img")
        title = node_text(title_node) if title_node else ""
        body = node_text(body_node_match) if body_node_match else ""
        if not title:
            continue
        cards.append(
            {
                "title": title,
                "body": body,
                "icon": {
                    "src": image_node.attrs.get("src", ""),
                    "alt": compact(image_node.attrs.get("alt", "")),
                }
                if image_node
                else None,
            }
        )
    return cards


def extract_pricing_tiles(section: Node) -> list[dict[str, str]]:
    tiles: list[dict[str, str]] = []
    for node in find_all(
        section,
        lambda current: "rt-polygon" in class_attr(current)
        or re.search(r"rt-about-square-(one|two|three)-block", class_attr(current)),
    ):
        price_node = find_first(node, lambda current: "progress-number-one" in class_attr(current))
        title_node = find_first(node, lambda current: "progress-number-two" in class_attr(current))
        detail_node = find_first(node, lambda current: "progress-number-three" in class_attr(current))
        price = node_text(price_node) if price_node else ""
        title = node_text(title_node) if title_node else ""
        detail = node_text(detail_node) if detail_node else ""
        if price or title or detail:
            tiles.append({"price": price, "title": title, "detail": detail})
    return unique(tiles, ("price", "title", "detail"))


def extract_columns(section: Node) -> list[list[str]]:
    columns: list[list[str]] = []
    for ul in find_all(section, lambda current: current.tag == "ul"):
        items = [node_text(li) for li in find_all(ul, lambda current: current.tag == "li") if node_text(li)]
        if items:
            columns.append(items)
    return columns


def extract_tabs(section: Node) -> list[dict[str, Any]]:
    tab_links = find_all(section, lambda current: "w-tab-link" in class_attr(current))
    panes = find_all(section, lambda current: "w-tab-pane" in class_attr(current))
    if not panes:
        return []
    tabs: list[dict[str, Any]] = []
    for index, pane in enumerate(panes):
        label = node_text(tab_links[index]) if index < len(tab_links) else pane.attrs.get("data-w-tab", f"Tab {index + 1}")
        title_node = find_first(pane, lambda current: current.tag in {"h3", "h4", "h5"})
        title = node_text(title_node) if title_node else label
        body = section_body(pane, title)
        tabs.append(
            {
                "label": label,
                "title": title,
                "body": body,
                "links": extract_links(pane, include_hash=False),
            }
        )
    return tabs


def extract_faq_items(section: Node) -> list[dict[str, str]]:
    question_nodes = find_all(section, lambda current: "rt-home-three-accordion-question-3" in class_attr(current))
    answer_nodes = find_all(section, lambda current: "rt-home-three-accordion-answer-3" in class_attr(current))
    if not question_nodes or len(question_nodes) != len(answer_nodes):
        return []
    items: list[dict[str, str]] = []
    for question_node, answer_node in zip(question_nodes, answer_nodes):
        question = node_text(question_node)
        answer = node_text(answer_node)
        if question and answer:
            items.append({"question": question, "answer": answer})
    return unique(items, ("question",))


def extract_form_fields(form: Node) -> list[dict[str, Any]]:
    fields: list[dict[str, Any]] = []
    for field in find_all(form, lambda current: current.tag in {"input", "textarea", "select"}):
        field_type = field.tag
        input_type = field.attrs.get("type", field_type or "text").lower()
        if field_type == "input" and input_type in {"submit", "hidden"}:
            continue

        field_id = field.attrs.get("id", "")
        label_node = find_first(
            form,
            lambda current: current.tag == "label" and current.attrs.get("for", "") == field_id,
        )
        options = []
        if field_type == "select":
            options = [
                node_text(option)
                for option in find_all(field, lambda current: current.tag == "option")
                if node_text(option)
            ]

        fields.append(
            {
                "label": node_text(label_node) if label_node else field.attrs.get("data-name", "") or field.attrs.get("name", ""),
                "name": field.attrs.get("name", ""),
                "fieldType": field_type,
                "inputType": input_type,
                "placeholder": field.attrs.get("placeholder", ""),
                "required": "required" in field.attrs,
                "options": options,
            }
        )

    return fields


def extract_form_section(section: Node) -> dict[str, Any] | None:
    form = find_first(section, lambda current: current.tag == "form")
    if not form:
        return None

    submit = find_first(
        form,
        lambda current: current.tag in {"button", "input"}
        and (
            current.tag == "button"
            or current.attrs.get("type", "").lower() == "submit"
        ),
    )

    submit_label = ""
    if submit:
        submit_label = node_text(submit) or submit.attrs.get("value", "")

    return {
        "kind": "form_section",
        "sourceClass": class_attr(section),
        "heading": first_heading(section),
        "body": section_body(section, first_heading(section)),
        "submitLabel": submit_label,
        "formAction": normalize_href(form.attrs.get("action", "")),
        "formMethod": form.attrs.get("method", "get").lower(),
        "fields": extract_form_fields(form),
    }


def extract_hero(section: Node) -> dict[str, Any]:
    links = extract_links(section, include_hash=False, include_tel=True)
    phone_link = next((link for link in links if link["href"].startswith("tel:")), None)
    primary_link = next((link for link in links if not link["href"].startswith("tel:")), None)
    return {
        "kind": "hero",
        "sourceClass": class_attr(section),
        "heading": first_heading(section),
        "body": section_body(section, first_heading(section)),
        "primaryCta": primary_link,
        "phoneCta": phone_link,
    }


def extract_link_section(section: Node, *, include_hash: bool = False) -> dict[str, Any]:
    items = extract_list_items(section)
    if not items:
        items = extract_links(section, include_hash=include_hash)
    return {
        "kind": "link_list",
        "sourceClass": class_attr(section),
        "heading": first_heading(section),
        "body": section_body(section, first_heading(section)),
        "items": items,
        "map": extract_map(section),
    }


def extract_rich_text_section(section: Node) -> dict[str, Any]:
    heading = first_heading(section)
    return {
        "kind": "rich_text",
        "sourceClass": class_attr(section),
        "heading": heading,
        "body": section_body(section, heading),
        "links": extract_links(section, include_hash=False),
    }


def extract_section(section: Node) -> dict[str, Any]:
    section_class = class_attr(section)
    heading = first_heading(section)

    if "simple-hero-section" in section_class:
        return extract_hero(section)

    if "client-brands-section" in section_class:
        return {
            "kind": "logo_strip",
            "sourceClass": section_class,
            "heading": heading,
            "logos": extract_logos(section),
        }

    faq_items = extract_faq_items(section)
    if faq_items:
        return {
            "kind": "faq_accordion",
            "sourceClass": section_class,
            "heading": heading,
            "items": faq_items,
        }

    form_section = extract_form_section(section)
    if form_section:
        return form_section

    tabs = extract_tabs(section)
    if tabs:
        return {
            "kind": "tabbed_content",
            "sourceClass": section_class,
            "heading": heading,
            "body": section_body(section, heading),
            "tabs": tabs,
        }

    pricing_tiles = extract_pricing_tiles(section)
    if pricing_tiles:
        return {
            "kind": "pricing_tiles",
            "sourceClass": section_class,
            "heading": heading,
            "body": section_body(section, heading),
            "tiles": pricing_tiles,
            "links": extract_links(section, include_hash=False),
        }

    cards = extract_feature_cards(section)
    if cards:
        return {
            "kind": "feature_cards",
            "sourceClass": section_class,
            "heading": heading,
            "body": section_body(section, heading),
            "cards": cards,
        }

    columns = extract_columns(section)
    if columns and ("managed-backflow-maintenance" in section_class or len(columns) > 1):
        return {
            "kind": "bullet_columns",
            "sourceClass": section_class,
            "heading": heading,
            "body": section_body(section, heading),
            "columns": columns,
        }

    if "cta-section" in section_class:
        return {
            "kind": "cta_banner",
            "sourceClass": section_class,
            "heading": heading,
            "body": section_body(section, heading),
            "links": extract_links(section, include_hash=False),
        }

    if "explaiber-section" in section_class or "service-areas" in section_class or extract_list_items(section):
        return extract_link_section(section, include_hash="backflow-testing-benefits" in section_class)

    if extract_links(section, include_hash=True):
        return extract_link_section(section, include_hash=True)

    return extract_rich_text_section(section)


def meta_value(root: Node, *, name: str | None = None, prop: str | None = None) -> str:
    def predicate(node: Node) -> bool:
        if node.tag != "meta":
            return False
        if name and node.attrs.get("name") == name:
            return True
        if prop and node.attrs.get("property") == prop:
            return True
        return False

    meta = find_first(root, predicate)
    return meta.attrs.get("content", "") if meta else ""


def parse_dom(path: Path) -> DOMParser:
    parser = DOMParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def inferred_family(row: dict[str, str]) -> str:
    slug = row["slug"]
    prefix = row["path_segment_1"]
    if prefix in CITY_PAGE_PREFIXES and "__" in slug:
        return "county_city_landing"
    if prefix == "commercial-backflow-specialists":
        return "commercial_vertical"
    if slug.endswith("service-areas") or row["template_family"] == "service_area_hub":
        return "service_area_hub"
    if row["template_family"] in MODELED_FAMILIES:
        return row["template_family"]
    return row["template_family"]


def infer_core_service_kind(slug: str) -> str:
    if slug.endswith("-faqs"):
        return "faq"
    if "backflow-installation" in slug:
        return "installation"
    if "backflow-repair" in slug:
        return "repair"
    if "backflow-testing" in slug:
        return "testing"
    if "irrigation" in slug:
        return "irrigation"
    if "swimming-pool" in slug:
        return "swimming_pool"
    return "core_service"


def infer_commercial_vertical_kind(slug: str) -> str:
    suffix = slug.split("__", 1)[1]
    suffix = re.sub(r"-backflow.*", "", suffix)
    return suffix


def city_name_from_slug(slug: str) -> str:
    city_fragment = slug.split("__", 1)[1]
    city_fragment = re.sub(r"-backflow.*", "", city_fragment)
    return city_fragment.replace("-", " ").title().replace(" Of ", " of ").replace(" La ", " La ")


def city_slug_from_slug(slug: str) -> str:
    city_fragment = slug.split("__", 1)[1]
    return re.sub(r"-backflow.*", "", city_fragment)


def county_slug_from_row(row: dict[str, str]) -> str:
    return row["path_segment_1"]


def anomaly_records_for(row: dict[str, str], full_text: str) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    if inferred_family(row) != row["template_family"]:
        records.append(
            {
                "code": "source_family_mismatch",
                "severity": "medium",
                "detail": f"Source CSV marks this page as '{row['template_family']}', but the slug and section pattern fit '{inferred_family(row)}'.",
            }
        )
    for pattern, code in TYPO_PATTERNS:
        if pattern.search(full_text):
            records.append(
                {
                    "code": code,
                    "severity": "low",
                    "detail": "Visible typo preserved from the live source copy.",
                }
            )
    records.extend(KNOWN_PAGE_ANOMALIES.get(row["slug"], []))
    return records


def base_payload(
    row: dict[str, str],
    seo_row: dict[str, str],
    heading_row: dict[str, str],
    dom: DOMParser,
) -> dict[str, Any]:
    sections = [extract_section(section) for section in top_level_content_blocks(dom.root)]
    full_text = "\n".join(filter(None, [seo_row.get("title", ""), seo_row.get("meta_description", ""), node_text(body_node(dom.root) or dom.root)]))
    anomaly_records = anomaly_records_for(row, full_text)
    hero_section = next((section for section in sections if section["kind"] == "hero"), None)
    logo_strip = next((section for section in sections if section["kind"] == "logo_strip"), None)

    return {
        "slug": row["slug"],
        "path": row["path"],
        "url": row["url"],
        "family": inferred_family(row),
        "sourceTemplateFamily": row["template_family"],
        "pageClass": row["page_class"],
        "title": seo_row.get("title", row.get("title", "")),
        "metaDescription": seo_row.get("meta_description", ""),
        "canonical": seo_row.get("canonical", row.get("canonical", "")),
        "h1": seo_row.get("h1", ""),
        "h2s": split_pipe(heading_row.get("h2s", "")),
        "h3s": split_pipe(heading_row.get("h3s", "")),
        "schemaTypes": split_pipe(seo_row.get("schema_types", "")),
        "wordCount": int(seo_row.get("word_count") or 0),
        "primaryKeywordIntent": seo_row.get("primary_keyword_intent", ""),
        "ctaPattern": split_pipe(seo_row.get("cta_pattern", "")),
        "heroImage": meta_value(dom.root, prop="og:image"),
        "hero": hero_section,
        "brandLogos": logo_strip.get("logos", []) if logo_strip else [],
        "sections": sections,
        "sectionKinds": [section["kind"] for section in sections],
        "anomalyFlags": [record["code"] for record in anomaly_records],
        "anomalyRecords": anomaly_records,
    }


def first_section(payload: dict[str, Any], kind: str) -> dict[str, Any] | None:
    return next((section for section in payload["sections"] if section["kind"] == kind), None)


def collect_sections(payload: dict[str, Any], kind: str) -> list[dict[str, Any]]:
    return [section for section in payload["sections"] if section["kind"] == kind]


def build_core_service_payload(payload: dict[str, Any]) -> dict[str, Any]:
    pricing = first_section(payload, "pricing_tiles")
    faq_sections = collect_sections(payload, "faq_accordion")
    tab_sections = collect_sections(payload, "tabbed_content")
    service_links = next(
        (
            section["items"]
            for section in reversed(payload["sections"])
            if section["kind"] == "link_list" and any(item.get("href", "").startswith("/") for item in section.get("items", []))
        ),
        [],
    )
    payload.update(
        {
            "serviceKind": infer_core_service_kind(payload["slug"]),
            "pricingTiles": pricing.get("tiles", []) if pricing else [],
            "faqItems": [item for section in faq_sections for item in section.get("items", [])],
            "tabGroups": [section.get("tabs", []) for section in tab_sections],
            "serviceAreaItems": service_links,
        }
    )
    return payload


def build_city_payload(payload: dict[str, Any], row: dict[str, str]) -> dict[str, Any]:
    pricing = first_section(payload, "pricing_tiles")
    bullet_columns = first_section(payload, "bullet_columns")
    service_area = next((section for section in payload["sections"] if section["kind"] == "link_list" and section.get("map")), None)
    tabbed = first_section(payload, "tabbed_content")
    county_slug = county_slug_from_row(row)
    payload.update(
        {
            "countySlug": county_slug,
            "countyName": COUNTY_NAMES[county_slug],
            "citySlug": city_slug_from_slug(payload["slug"]),
            "cityName": city_name_from_slug(payload["slug"]),
            "serviceVariant": "testing_installation_repair" if "installation-repair" in payload["slug"] else "testing_repair",
            "pricingTiles": pricing.get("tiles", []) if pricing else [],
            "maintenanceColumns": bullet_columns.get("columns", []) if bullet_columns else [],
            "neighborhoodItems": service_area.get("items", []) if service_area else [],
            "serviceAreaMap": service_area.get("map") if service_area else None,
            "regulationTabs": tabbed.get("tabs", []) if tabbed else [],
        }
    )
    return payload


def build_service_area_hub_payload(payload: dict[str, Any], row: dict[str, str]) -> dict[str, Any]:
    link_lists = collect_sections(payload, "link_list")
    quick_links = next((section.get("items", []) for section in link_lists if any(item.get("href", "").startswith("#") for item in section.get("items", []))), [])
    city_links = next(
        (
            section.get("items", [])
            for section in reversed(link_lists)
            if any(item.get("href", "").startswith("/") for item in section.get("items", []))
        ),
        [],
    )
    county_slug = ""
    county_name = ""
    for known_slug, known_name in COUNTY_NAMES.items():
        if payload["slug"].startswith(known_slug):
            county_slug = known_slug
            county_name = known_name
            break
    payload.update(
        {
            "countySlug": county_slug,
            "countyName": county_name,
            "hubScope": county_name or "Southern California",
            "quickLinks": quick_links,
            "cityLinks": city_links,
        }
    )
    return payload


def build_commercial_payload(payload: dict[str, Any]) -> dict[str, Any]:
    features = first_section(payload, "feature_cards")
    pricing = first_section(payload, "pricing_tiles")
    link_sections = collect_sections(payload, "link_list")
    payload.update(
        {
            "industrySlug": infer_commercial_vertical_kind(payload["slug"]),
            "featureCards": features.get("cards", []) if features else [],
            "pricingTiles": pricing.get("tiles", []) if pricing else [],
            "reviewLinks": [item for section in link_sections for item in section.get("items", [])],
        }
    )
    return payload


def county_slug_from_special_slug(slug: str) -> str:
    for prefix, county_slug in SPECIAL_COUNTY_PREFIXES.items():
        if slug.startswith(prefix):
            return county_slug
    return ""


def build_home_payload(payload: dict[str, Any]) -> dict[str, Any]:
    pricing = first_section(payload, "pricing_tiles")
    service_area = next(
        (
            section
            for section in reversed(payload["sections"])
            if section["kind"] == "link_list" and section.get("items")
        ),
        None,
    )
    payload.update(
        {
            "pricingTiles": pricing.get("tiles", []) if pricing else [],
            "serviceAreaItems": service_area.get("items", []) if service_area else [],
        }
    )
    return payload


def build_about_payload(payload: dict[str, Any]) -> dict[str, Any]:
    feature_section = first_section(payload, "feature_cards")
    tab_sections = collect_sections(payload, "tabbed_content")
    payload.update(
        {
            "featureCards": feature_section.get("cards", []) if feature_section else [],
            "tabGroups": [section.get("tabs", []) for section in tab_sections],
        }
    )
    return payload


def build_contact_payload(payload: dict[str, Any]) -> dict[str, Any]:
    payload.update(
        {
            "contactForm": first_section(payload, "form_section"),
        }
    )
    return payload


def build_county_service_hub_payload(payload: dict[str, Any]) -> dict[str, Any]:
    county_slug = county_slug_from_special_slug(payload["slug"])
    feature_section = first_section(payload, "feature_cards")
    pricing = first_section(payload, "pricing_tiles")
    service_area = next(
        (
            section
            for section in reversed(payload["sections"])
            if section["kind"] == "link_list" and section.get("items")
        ),
        None,
    )
    payload.update(
        {
            "countySlug": county_slug,
            "countyName": COUNTY_NAMES.get(county_slug, ""),
            "featureCards": feature_section.get("cards", []) if feature_section else [],
            "pricingTiles": pricing.get("tiles", []) if pricing else [],
            "serviceAreaItems": service_area.get("items", []) if service_area else [],
        }
    )
    return payload


def build_regulation_payload(payload: dict[str, Any]) -> dict[str, Any]:
    county_slug = county_slug_from_special_slug(payload["slug"])
    tab_sections = collect_sections(payload, "tabbed_content")
    link_sections = collect_sections(payload, "link_list")
    map_section = next((section for section in link_sections if section.get("map")), None)
    payload.update(
        {
            "countySlug": county_slug,
            "countyName": COUNTY_NAMES.get(county_slug, ""),
            "authorityTabs": tab_sections[0].get("tabs", []) if tab_sections else [],
            "regulationTabs": tab_sections[1].get("tabs", []) if len(tab_sections) > 1 else [],
            "resourceMap": map_section.get("map") if map_section else None,
        }
    )
    return payload


def build_legal_payload(payload: dict[str, Any]) -> dict[str, Any]:
    legal_blocks = [section for section in payload["sections"] if section["kind"] == "rich_text"]
    payload.update(
        {
            "legalBody": "\n\n".join(
                block.get("body", "") for block in legal_blocks if block.get("body", "")
            ),
        }
    )
    return payload


def add_unique_anomaly(
    payload: dict[str, Any],
    *,
    code: str,
    severity: str,
    detail: str,
) -> None:
    existing = {
        (record["code"], record["detail"])
        for record in payload.get("anomalyRecords", [])
    }
    key = (code, detail)
    if key in existing:
        return
    payload.setdefault("anomalyRecords", []).append(
        {
            "code": code,
            "severity": severity,
            "detail": detail,
        }
    )
    payload["anomalyFlags"] = [record["code"] for record in payload["anomalyRecords"]]


def count_named_mentions(
    text: str,
    names: list[str],
    *,
    ignore_name: str,
) -> list[tuple[int, str]]:
    normalized_text = text.lower()
    ignore_name = ignore_name.lower()
    matches: list[tuple[int, str]] = []
    for name in names:
        candidate = name.lower()
        if candidate == ignore_name:
            continue
        if candidate in ignore_name or ignore_name in candidate:
            continue
        count = len(re.findall(rf"\b{re.escape(candidate)}\b", normalized_text))
        if count:
            matches.append((count, name))
    matches.sort(reverse=True)
    return matches


def count_phrase_mentions(text: str, phrase: str) -> int:
    if not phrase:
        return 0
    return len(re.findall(rf"\b{re.escape(phrase.lower())}\b", text.lower()))


def adjusted_city_mentions(
    text: str,
    city_names: list[str],
    *,
    ignore_name: str,
) -> list[tuple[int, str]]:
    adjusted_hits: list[tuple[int, str]] = []
    for raw_count, city_name in count_named_mentions(text, city_names, ignore_name=ignore_name):
        adjusted_count = raw_count
        adjusted_count -= count_phrase_mentions(text, f"{city_name} County")
        adjusted_count -= count_phrase_mentions(text, f"County of {city_name}")
        if adjusted_count > 0:
            adjusted_hits.append((adjusted_count, city_name))
    adjusted_hits.sort(reverse=True)
    return adjusted_hits


def first_locality_hit(
    fields: list[tuple[str, str]],
    names: list[str],
    *,
    ignore_name: str,
    city_mode: bool = False,
) -> tuple[str, int, str] | None:
    for field_name, text in fields:
        if not text.strip():
            continue
        hits = (
            adjusted_city_mentions(text, names, ignore_name=ignore_name)
            if city_mode
            else count_named_mentions(text, names, ignore_name=ignore_name)
        )
        if hits:
            count, matched_name = hits[0]
            return field_name, count, matched_name
    return None


def audit_city_payload(
    payload: dict[str, Any],
    city_names: list[str],
    county_names: list[str],
) -> dict[str, Any]:
    if payload["family"] != "county_city_landing":
        return payload

    city_name = payload.get("cityName", "")
    county_name = payload.get("countyName", "")
    service_area_sections = [
        section
        for section in payload["sections"]
        if section["kind"] == "link_list" and section.get("map")
    ]
    regulation_tabs = [
        tab
        for tab in payload.get("regulationTabs", [])
        if not re.search(
            r"profile|office info",
            f"{tab.get('label', '')} {tab.get('title', '')}",
            re.I,
        )
    ]

    service_area_text = "\n".join(
        filter(
            None,
            [
                " ".join(
                    filter(
                        None,
                        [
                            section.get("heading", ""),
                            section.get("body", ""),
                            " ".join(item.get("label", "") for item in section.get("items", [])),
                        ],
                    )
                )
                for section in service_area_sections
            ],
        )
    )
    regulation_text = "\n".join(
        f"{tab.get('title', '')} {tab.get('body', '')}" for tab in regulation_tabs
    )
    label_fields = [
        ("title", payload.get("title", "")),
        ("h1", payload.get("h1", "")),
        ("hero heading", (payload.get("hero") or {}).get("heading", "")),
        ("section headings", " ".join(payload.get("h2s", []))),
    ]

    service_area_hits = adjusted_city_mentions(
        service_area_text,
        city_names,
        ignore_name=city_name,
    )
    if service_area_hits and service_area_hits[0][0] >= 3:
        count, other_city = service_area_hits[0]
        add_unique_anomaly(
            payload,
            code="locality_drift_service_area",
            severity="medium",
            detail=f"Service-area copy references '{other_city}' {count} times on the {city_name} page.",
        )

    regulation_hits = adjusted_city_mentions(
        regulation_text,
        city_names,
        ignore_name=city_name,
    )
    if regulation_hits and regulation_hits[0][0] >= 5:
        count, other_city = regulation_hits[0]
        add_unique_anomaly(
            payload,
            code="locality_drift_regulations",
            severity="medium",
            detail=f"Regulation content references '{other_city}' {count} times on the {city_name} page.",
        )

    city_label_hit = first_locality_hit(
        label_fields,
        city_names,
        ignore_name=city_name,
        city_mode=True,
    )
    if city_label_hit:
        field_name, _, other_city = city_label_hit
        add_unique_anomaly(
            payload,
            code="city_label_drift",
            severity="high",
            detail=f"Visible {field_name} copy references '{other_city}' on the {city_name} page.",
        )

    county_hits = count_named_mentions(
        f"{service_area_text}\n{regulation_text}",
        county_names,
        ignore_name=county_name,
    )
    if county_hits and county_hits[0][0] >= 3:
        count, other_county = county_hits[0]
        add_unique_anomaly(
            payload,
            code="county_label_drift",
            severity="medium",
            detail=f"County-specific copy references '{other_county}' {count} times on the {city_name} page.",
        )

    county_label_hit = first_locality_hit(
        label_fields,
        county_names,
        ignore_name=county_name,
    )
    if county_label_hit:
        field_name, _, other_county = county_label_hit
        add_unique_anomaly(
            payload,
            code="county_label_drift",
            severity="high",
            detail=f"Visible {field_name} copy references '{other_county}' on the {city_name} page.",
        )

    return payload


def build_archived_decisions(rows: list[dict[str, str]]) -> list[dict[str, Any]]:
    decisions: list[dict[str, Any]] = []
    for row in rows:
        decision = ARCHIVED_PAGE_DECISIONS.get(
            row["slug"],
            {
                "decision": "review",
                "target": row.get("likely_live_replacement", ""),
                "reason": "No explicit archived-page decision was defined yet.",
            },
        )
        decisions.append(
            {
                "slug": row["slug"],
                "url": row["url"],
                "title": row["title"],
                "roleGuess": row["role_guess"],
                "latestWaybackUrl": row["latest_wayback_url"],
                "likelyLiveReplacement": row["likely_live_replacement"],
                "roundOneDecision": decision["decision"],
                "redirectTarget": decision["target"],
                "reason": decision["reason"],
            }
        )
    return decisions


def build_anomaly_log(pages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for page in pages:
        for record in page["anomalyRecords"]:
            records.append(
                {
                    "slug": page["slug"],
                    "path": page["path"],
                    "family": page["family"],
                    "severity": record["severity"],
                    "code": record["code"],
                    "detail": record["detail"],
                }
            )
    records.sort(key=lambda item: (item["severity"], item["slug"], item["code"]))
    return records


def main() -> int:
    url_rows = read_csv(URL_INVENTORY_CSV)
    seo_rows = {row["slug"]: row for row in read_csv(PAGE_SEO_MATRIX_CSV)}
    heading_rows = {row["slug"]: row for row in read_csv(PAGE_HEADING_MAP_CSV)}
    archived_rows = read_csv(WAYBACK_ARCHIVED_ONLY_PAGES_CSV)
    city_names = [
        city_name_from_slug(row["slug"])
        for row in url_rows
        if row["path_segment_1"] in CITY_PAGE_PREFIXES and "__" in row["slug"]
    ]
    county_label_names = list(COUNTY_NAMES.values())

    modeled_pages: list[dict[str, Any]] = []
    home_pages: list[dict[str, Any]] = []
    about_pages: list[dict[str, Any]] = []
    contact_pages: list[dict[str, Any]] = []
    core_service_pages: list[dict[str, Any]] = []
    county_city_pages: list[dict[str, Any]] = []
    service_area_hubs: list[dict[str, Any]] = []
    commercial_vertical_pages: list[dict[str, Any]] = []
    county_service_hubs: list[dict[str, Any]] = []
    regulation_pages: list[dict[str, Any]] = []
    legal_pages: list[dict[str, Any]] = []
    omitted_live_pages: list[dict[str, str]] = []

    for row in url_rows:
        family = inferred_family(row)
        if family not in MODELED_FAMILIES:
            omitted_live_pages.append(
                {
                    "slug": row["slug"],
                    "path": row["path"],
                    "sourceTemplateFamily": row["template_family"],
                    "pageClass": row["page_class"],
                }
            )
            continue

        html_path = HTML_ROOT / f"{row['slug']}.html"
        if not html_path.exists():
            continue

        dom = parse_dom(html_path)
        payload = base_payload(
            row,
            seo_rows.get(row["slug"], {}),
            heading_rows.get(row["slug"], {}),
            dom,
        )

        if family == "homepage":
            payload = build_home_payload(payload)
            home_pages.append(payload)
        elif family == "about_page":
            payload = build_about_payload(payload)
            about_pages.append(payload)
        elif family == "contact_page":
            payload = build_contact_payload(payload)
            contact_pages.append(payload)
        elif family == "core_service":
            payload = build_core_service_payload(payload)
            core_service_pages.append(payload)
        elif family == "county_city_landing":
            payload = build_city_payload(payload, row)
            payload = audit_city_payload(payload, city_names, county_label_names)
            county_city_pages.append(payload)
        elif family == "service_area_hub":
            payload = build_service_area_hub_payload(payload, row)
            service_area_hubs.append(payload)
        elif family == "commercial_vertical":
            payload = build_commercial_payload(payload)
            commercial_vertical_pages.append(payload)
        elif family == "county_service_hub":
            payload = build_county_service_hub_payload(payload)
            county_service_hubs.append(payload)
        elif family == "regulation_page":
            payload = build_regulation_payload(payload)
            regulation_pages.append(payload)
        elif family == "legal_page":
            payload = build_legal_payload(payload)
            legal_pages.append(payload)

        modeled_pages.append(payload)

    archived_decisions = build_archived_decisions(archived_rows)
    anomaly_log = build_anomaly_log(modeled_pages)
    anomaly_counts = Counter(record["code"] for record in anomaly_log)
    family_counts = Counter(page["family"] for page in modeled_pages)
    page_lookup = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "modeledPageCount": len(modeled_pages),
        "pagesByPath": {
            page["path"]: page for page in modeled_pages
        },
    }

    page_index = {
        "generatedAt": page_lookup["generatedAt"],
        "familyCounts": dict(family_counts),
        "modeledPageCount": len(modeled_pages),
        "omittedLivePageCount": len(omitted_live_pages),
        "sourceFamilyMismatchCount": sum(1 for page in modeled_pages if page["family"] != page["sourceTemplateFamily"]),
        "topAnomalyCodes": anomaly_counts.most_common(),
        "pages": [
            {
                "slug": page["slug"],
                "path": page["path"],
                "family": page["family"],
                "title": page["title"],
                "countySlug": page.get("countySlug", ""),
                "citySlug": page.get("citySlug", ""),
            }
            for page in modeled_pages
        ],
        "omittedLivePages": omitted_live_pages,
    }

    write_json(OUTPUT_ROOT / "home-pages.json", home_pages)
    write_json(OUTPUT_ROOT / "about-pages.json", about_pages)
    write_json(OUTPUT_ROOT / "contact-pages.json", contact_pages)
    write_json(OUTPUT_ROOT / "core-service-pages.json", core_service_pages)
    write_json(OUTPUT_ROOT / "county-city-pages.json", county_city_pages)
    write_json(OUTPUT_ROOT / "service-area-hubs.json", service_area_hubs)
    write_json(OUTPUT_ROOT / "commercial-vertical-pages.json", commercial_vertical_pages)
    write_json(OUTPUT_ROOT / "county-service-hubs.json", county_service_hubs)
    write_json(OUTPUT_ROOT / "regulation-pages.json", regulation_pages)
    write_json(OUTPUT_ROOT / "legal-pages.json", legal_pages)
    write_json(OUTPUT_ROOT / "archived-page-decisions.json", archived_decisions)
    write_json(OUTPUT_ROOT / "content-anomalies.json", anomaly_log)
    write_json(OUTPUT_ROOT / "page-index.json", page_index)
    write_json(OUTPUT_ROOT / "page-lookup.json", page_lookup)

    print(f"Wrote {OUTPUT_ROOT / 'home-pages.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'about-pages.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'contact-pages.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'core-service-pages.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'county-city-pages.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'service-area-hubs.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'commercial-vertical-pages.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'county-service-hubs.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'regulation-pages.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'legal-pages.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'archived-page-decisions.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'content-anomalies.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'page-index.json'}")
    print(f"Wrote {OUTPUT_ROOT / 'page-lookup.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
