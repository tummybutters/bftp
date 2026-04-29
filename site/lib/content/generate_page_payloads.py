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
COUNTY_DIRECTORY_COPY = {
    "ventura-county": (
        "Coverage for Ventura, Oxnard, Camarillo, Thousand Oaks, and surrounding Ventura County properties."
    ),
    "la-county": (
        "Service support for restaurants, retail, multifamily, and commercial sites across Los Angeles County."
    ),
    "orange-county": (
        "Managed testing, installation, and repair coverage throughout Orange County's core business corridors."
    ),
    "san-bernardino-county": (
        "Backflow compliance support for Inland Empire commercial, industrial, and residential properties."
    ),
    "riverside-county": (
        "Local scheduling and compliance help for Riverside County HOAs, retail sites, and growing portfolios."
    ),
    "san-diego": (
        "Certified backflow service for coastal and inland San Diego County properties and municipalities."
    ),
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

HOMEPAGE_PROOF_ITEMS = [
    "Licensed CA Contractor",
    "Multi-Device Discounts",
    "AWWA Certified Testers",
    "Bonded & Insured",
    "Repair Coverage Available",
    "Same-Day Report Submittal",
    "Priority Scheduling",
    "Local Authority Coordination",
    "Compliance Scheduling Support",
]

HOMEPAGE_SERVICE_ITEMS = [
    {
        "label": "Backflow Prevention Testing",
        "href": "/backflow-testing",
        "external": False,
        "target": "",
        "description": (
            "Backflow prevention testing refers to annual testing of installed backflow preventer "
            "that ensure water flows in only one direction to prevent the contamination of our public water supply.\n\n"
            "Commercial and public facilities are typically required to have backflow preventers tested annually to ensure that they are functioning properly.\n\n"
            "In California, backflow prevention testing can only be performed by certified backflow testers who have the proper training and credentials to test, repair and install backflow assemblies in addition to submitting formal reports to local water authority, health department, or relevant regulatory body.\n\n"
            "Failure to provide proper documentation or submit test results on time can lead to penalties, fines, or other actions.\n\n"
            "Backflow Test Pros helps ensure you meet water safety compliance requirements and avoid civil penalties."
        ),
    },
    {
        "label": "Backflow Repair & Replacement",
        "href": "/backflow-repair-replacement-services",
        "external": False,
        "target": "",
        "description": (
            "Failure to comply with the state, county and local municipality backflow inspection, repair and maintenance requirements may expose you to fines or penalties in addition to having the county health department or local water authority disconnect your property's water service.\n\n"
            "If a backflow preventer is found to be leaking, malfunctioning or damaged during testing or inspection, the facility must repair or replace the device promptly.\n\n"
            "Failure to do so can result in fines, water service disconnection, lawsuits, and potential liability for any damages caused by contamination.\n\n"
            "Don't risk letting your defective, leaking or broken backflow prevention assemblies trigger costly civil penalties and disruption of your business.\n\n"
            "Backflow Test Pros helps ensure you meet water safety avoid civil penalties and disruptions to your business."
        ),
    },
    {
        "label": "Backflow preventer Installations",
        "href": "/backflow-installation",
        "external": False,
        "target": "",
        "description": (
            "Backflow is the undesired unintended reversal of flow of water and/or other liquids, gases, or other substances into a PWS's distribution system or water supply.\n\n"
            "The California State Water Resource Control Board requires that properly installed and maintained backflow assemblies be installed by certified specialists who are trained to properly evaluate the type and degree of hazards which exists in the distribution system.\n\n"
            "Failure to install approved backflow preventers can lead to significant fines and disruptions to your water service until the backflow prevention issues are resolved\n\n"
            "Non-compliance also increases the risk of water contamination, which can lead to contamination related health hazards, lawsuits, and potential liability for any damages caused by any contamination.\n\n"
            "Backflow Test Pros helps ensure you meet water safety avoid civil penalties and disruptions to your business."
        ),
    },
]

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


def normalize_local_link_items(links: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized_links: list[dict[str, Any]] = []
    for link in links:
        href = link.get("href", "")
        resolved_href = path_from_url(href)
        normalized_links.append(
            {
                **link,
                "href": resolved_href,
                "external": is_external_href(resolved_href),
                "target": "" if not is_external_href(resolved_href) else link.get("target", "_blank"),
            }
        )
    return normalized_links


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
            "links": extract_links(section, include_hash=False),
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


def county_city_counts(rows: list[dict[str, str]]) -> dict[str, int]:
    counts: Counter[str] = Counter()
    for row in rows:
        if row["path_segment_1"] in CITY_PAGE_PREFIXES and "__" in row["slug"]:
            counts[row["path_segment_1"]] += 1
    return dict(counts)


def count_label(count: int) -> str:
    return "1 city" if count == 1 else f"{count} cities"


def city_page_service_copy(service_variant: str) -> dict[str, str]:
    if service_variant == "testing_installation_repair":
        return {
            "title": "Testing, Installation & Repair",
            "noun": "testing, installation, and repair",
            "verb": "test, install, and repair",
            "service_items": [
                "Annual backflow testing",
                "Backflow installation",
                "Repairs and replacements",
                "Device troubleshooting",
                "Ongoing maintenance support",
            ],
        }
    return {
        "title": "Testing & Repair",
        "noun": "testing and repair",
        "verb": "test and repair",
        "service_items": [
            "Annual backflow testing",
            "Failed assembly repairs",
            "Device troubleshooting",
            "Preventive maintenance",
            "Replacement guidance",
        ],
    }


def coordination_items() -> list[str]:
    return [
        "Certification paperwork",
        "Water authority coordination",
        "Scheduling support",
        "Multi-property service",
        "Compliance reminders",
    ]


def county_from_card_title(title: str) -> tuple[str, str] | None:
    normalized = title.lower()
    for county_slug, county_name in COUNTY_NAMES.items():
        if county_name.lower() in normalized:
            return county_slug, county_name
    return None


def rewrite_root_service_area_hub_copy(
    payload: dict[str, Any],
    *,
    city_counts: dict[str, int],
) -> None:
    payload["title"] = "Southern California Backflow Service Areas | Backflow Test Pros"
    payload["metaDescription"] = (
        "Browse county and city service areas for backflow testing, installation, and repair "
        "throughout Southern California."
    )

    hero = first_section(payload, "hero")
    if hero:
        hero["heading"] = "Southern California Backflow Service Areas"
        hero["body"] = (
            "Browse county-by-county service coverage for backflow testing, installation, and repair "
            "throughout Southern California.\n\n"
            "Start with your county, then open the city page that matches your property, paperwork, "
            "and scheduling needs."
        )
        if hero.get("primaryCta"):
            hero["primaryCta"]["label"] = "Contact Backflow Test Pros"
    payload["h2s"] = ["Browse Counties", "Trusted Across Southern California"]

    county_directory = first_section(payload, "link_list")
    if county_directory:
        county_directory["heading"] = "Browse Counties"
        county_directory["body"] = (
            "Start with the county, then drill down to the city page that matches your property. "
            "Each county directory leads to local testing, installation, and repair coverage."
        )
        for item in county_directory.get("items", []):
            county_match = county_from_card_title(item.get("label", ""))
            if not county_match:
                continue
            county_slug, county_name = county_match
            item["label"] = county_name
            item["description"] = COUNTY_DIRECTORY_COPY.get(
                county_slug,
                "Certified backflow testing, installation, repair, and paperwork support for local properties.",
            )

    proof_section = first_section(payload, "rich_text")
    if proof_section:
        proof_section["heading"] = "Trusted Across Southern California"
        proof_section["body"] = (
            "Commercial properties, HOAs, restaurants, retail sites, and multi-location operators "
            "across Southern California rely on us for dependable scheduling, certification paperwork, "
            "and compliant backflow service."
        )


def rewrite_county_service_area_hub_copy(
    payload: dict[str, Any],
    *,
    county_name: str,
    city_count: int,
) -> None:
    count_copy = count_label(city_count) if city_count else "local cities"
    payload["title"] = f"{county_name} Backflow Testing, Installation & Repair Service Areas"
    payload["metaDescription"] = (
        f"Browse {count_copy} we serve in {county_name} for backflow testing, installation, "
        "repair, and certification support."
    )

    hero = first_section(payload, "hero")
    if hero:
        hero["heading"] = f"{county_name} Backflow Testing, Installation & Repair Service Areas"
        hero["body"] = (
            f"Use this county directory to find the city page that matches your property in {county_name}.\n\n"
            "Each city page rolls up local service coverage for annual testing, installation work, "
            "repairs, certification paperwork, and ongoing compliance support."
        )
    payload["h2s"] = [
        f"Schedule service anywhere in {county_name}",
        f"Cities We Serve in {county_name}",
    ]

    feature_section = first_section(payload, "feature_cards")
    if feature_section:
        feature_section["heading"] = f"Service Coverage Across {county_name}"
        feature_section["body"] = (
            f"Choose the city page that matches your property in {county_name}, then contact us "
            "if you need help confirming scope, paperwork, or scheduling."
        )
        feature_section["cards"] = [
            {
                "title": f"{county_name} Annual Testing",
                "body": "Find the right city page for annual testing, certification paperwork, and ongoing compliance support.",
                "icon": feature_section.get("cards", [{}])[0].get("icon"),
            },
            {
                "title": f"{county_name} Installation",
                "body": "Review local service coverage for new devices, replacements, and installation planning.",
                "icon": feature_section.get("cards", [{}, {}])[1].get("icon"),
            },
            {
                "title": f"{county_name} Repair",
                "body": "Open the city page that fits your property when a device fails, needs troubleshooting, or requires replacement.",
                "icon": feature_section.get("cards", [{}, {}, {}])[2].get("icon"),
            },
        ]

    cta_banner = first_section(payload, "cta_banner")
    if cta_banner:
        cta_banner["heading"] = f"Schedule service anywhere in {county_name}"
        cta_banner["body"] = (
            "We coordinate testing, installation, repair, certification paperwork, and multi-property "
            f"scheduling throughout {county_name}."
        )

    directory = first_section(payload, "bullet_columns")
    if directory:
        directory["heading"] = f"Cities We Serve in {county_name}"
        directory["body"] = (
            f"Browse all {count_copy} we cover in {county_name}, then open the city page that best "
            "matches your property, compliance requirements, and service needs."
        )


def rewrite_city_landing_copy(payload: dict[str, Any]) -> None:
    city_name = payload.get("cityName", "")
    county_name = payload.get("countyName", "")
    service_variant = payload.get("serviceVariant", "testing_installation_repair")
    service_copy = city_page_service_copy(service_variant)

    payload["title"] = f"{city_name} Backflow {service_copy['title']} | Backflow Test Pros"
    payload["metaDescription"] = (
        f"Backflow {service_copy['noun']} in {city_name}, {county_name}. Certified service, local "
        "compliance support, repairs, and scheduling for residential and commercial properties."
    )
    payload["h1"] = f"{city_name} Backflow {service_copy['title']}"

    hero = first_section(payload, "hero")
    if hero:
        hero["heading"] = f"{city_name} Backflow {service_copy['title']}"
        hero["body"] = (
            f"Backflow Test Pros provides backflow {service_copy['noun']} for commercial and residential "
            f"properties in {city_name}.\n\n"
            f"We help local owners and property managers {service_copy['verb']}, submit paperwork, stay "
            "on schedule, and avoid preventable compliance issues with the local water authority."
        )
        if hero.get("primaryCta"):
            hero["primaryCta"]["label"] = f"Request Service in {city_name}"

    cta_banner = first_section(payload, "cta_banner")
    if cta_banner:
        cta_banner["heading"] = f"Need backflow service in {city_name}?"
        cta_banner["body"] = (
            f"Contact us to schedule backflow {service_copy['noun']} in {city_name} and confirm the "
            "right scope for your property."
        )

    bullet_columns = first_section(payload, "bullet_columns")
    if bullet_columns:
        bullet_columns["heading"] = f"What We Handle in {city_name}"
        bullet_columns["body"] = (
            f"We help {city_name} properties stay compliant, keep water service moving, and resolve "
            "backflow issues without unnecessary delays or paperwork confusion."
        )
        bullet_columns["columns"] = [
            service_copy["service_items"],
            coordination_items(),
        ]

    service_area = next(
        (section for section in payload["sections"] if section["kind"] == "link_list" and section.get("map")),
        None,
    )
    if service_area:
        service_area["heading"] = f"Neighborhoods We Serve in {city_name}"
        service_area["body"] = (
            f"Browse the neighborhoods and nearby areas we cover throughout {city_name}. "
            "If you manage multiple properties or need help confirming coverage, contact us and we "
            "will point you to the right route."
        )


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
    apply_core_service_copy_overrides(payload)
    return payload


def apply_core_service_copy_overrides(payload: dict[str, Any]) -> None:
    path = payload.get("path")

    proof_strip = next(
        (
            section
            for section in payload["sections"]
            if section["kind"] == "rich_text"
            and section.get("sourceClass") == "marquee-simple-item"
        ),
        None,
    )
    if proof_strip:
        proof_strip["body"] = "\n".join(HOMEPAGE_PROOF_ITEMS)

    if path == "/backflow-testing":
        hero = first_section(payload, "hero")
        if hero:
            hero["body"] = (
                "Backflow Test Pros annual backflow preventer testing services ensure that your home or commercial property meets state, county and local regulations so that the water service to your property is not shut off due to leaking or damaged backflow preventer assemblies.\n\n"
                "As a bonded and insured licensed contractor, we offer peace of mind while guaranteeing top-tier workmanship. With priority scheduling, same-day certification, and a multi-device discount, we take care of your backflow preventer installation testing repair and replacement needs so you can avoid penalties and prevent water service disruptions to your home or business.\n\n"
                "Schedule Your Backflow Tests Today\n"
                "For Up to $500 Repair Coverage Credit"
            )
            payload["hero"] = hero

        benefits = next(
            (
                section
                for section in payload["sections"]
                if section["kind"] == "feature_cards"
                and "backflow-testing-benefits" in section.get("sourceClass", "")
            ),
            None,
        )
        if benefits:
            benefits["body"] = (
                "State regulations require that residential, commercial and industrial customers served by a public water system take adequate measures to protect the public water system from potential contamination. Backflow Test Pros is 100% dedicated to ensuring your business meets local water authority annual backflow preventer testing and repair requirements so you can avoid civil penalties and ensure your water is not turned off for noncompliance."
            )
            benefits["cards"] = [
                {
                    "title": "Priority Scheduling",
                    "body": "Schedule in advance to secure convenient backflow test time and ensure water authority certification",
                    "icon": benefits.get("cards", [{}])[0].get("icon"),
                },
                {
                    "title": "City Documents Retrieval",
                    "body": "Save time and avoid the headache of finding your city backflow prevention test certification letter",
                    "icon": benefits.get("cards", [{}, {}])[1].get("icon"),
                },
                {
                    "title": "Repair Coverage",
                    "body": "Avoid costly disruptions to your business operations with the Backflow Test Pros  backflow repair coverage",
                    "icon": benefits.get("cards", [{}, {}, {}])[2].get("icon"),
                },
                {
                    "title": "Same-Day Certification",
                    "body": "Document your backflow prevention test status with automated same day water authority certification",
                    "icon": benefits.get("cards", [{}, {}, {}, {}])[3].get("icon"),
                },
            ]

        pricing = first_section(payload, "pricing_tiles")
        if pricing:
            pricing["body"] = (
                "We provide the best value in backflow preventer testing and repair services by combining competitive pricing with premium service and unmatched expertise. Our national, state and local municipality certified specialists ensure regulatory compliance to deliver precision and reliability in every inspection. As a bonded and insured licensed contractor, we offer peace of mind while guaranteeing top-tier workmanship. With priority scheduling, same-day certification, and a multi-device discount, we take care of your backflow preventer testing and maintenance needs so you can focus on running your business\n\n"
                "Whether you need routine testing or urgent repairs, our satisfaction guarantee ensures you receive the highest level of service at the most competitive rates."
            )
            pricing["tiles"] = [
                {
                    "price": "$99",
                    "title": "Residential Testing Value Package",
                    "detail": "Call to Schedule",
                },
                {
                    "price": "$99",
                    "title": "Multi-Device Testing Bundle",
                    "detail": "Request Pricing *",
                },
                {
                    "price": "$159",
                    "title": "Commercial Testing Value Package",
                    "detail": "Managed Service",
                },
            ]
            pricing["links"] = [
                {
                    "label": "Ask for Multi-Location Scheduling to Qualify for $500 in Repair Coverage",
                    "href": "/contact-backflowtestpros",
                    "external": False,
                    "target": "_blank",
                }
            ]

        guide = first_section(payload, "tabbed_content")
        if guide:
            guide["body"] = (
                "The inspection and testing of backflow preventer devices are essential for ensuring the safety of the water supply and compliance with state and local regulations. Hiring a certified backflow tester to perform backflow preventer testing and accurate timely reporting of test documentation is key to ensuring compliance with state and municipal water department regulations.\n\n"
                "For a more detailed review of backflow prevention testing issues and the importance of backflow testing by certified backflow test technicians please reference our\n"
                "Annual Backflow Testing Frequently Asked Questions"
            )
            tabs = guide.get("tabs", [])
            if len(tabs) > 0:
                tabs[0]["body"] = (
                    "Annual backflow testing is the process of inspecting and testing a backflow preventer device to ensure that it is working properly. A backflow prevention device is installed in plumbing systems to prevent contaminated water from flowing back into the clean water supply. This is crucial to avoid water pollution, which could potentially harm public health.\n\n"
                    "Because backflow preventer devices are so crucial to safeguarding public health and preventing contamination of the potable water supply, it is critical that backflow preventer assemblies be tested periodically to ensure the safety of our water supply.\n\n"
                    "Backflow preventer testing is typically required once a year by local municipalities or health departments. A certified backflow tester or plumber checks the backflow preventer's functionality to make sure it is effectively preventing reverse water flow. If the device fails the test, it will need to be repaired or replaced.\n\n"
                    "Backflow preventer testing is common in areas like commercial buildings, apartments, or properties with irrigation systems. It helps ensure the integrity of the water supply, maintaining safe and clean drinking water.\n\n"
                    "Below is a list of the type of properties where backflow prevention is paticularly important:\n\n"
                    "- Commercial Properties: Businesses often have complex plumbing systems, including irrigation systems, boilers, or fire suppression systems, which may require backflow prevention.\n"
                    "- Residential properties with Irrigation Systems: Homes with sprinkler systems or irrigation systems can create a potential for backflow, especially if there's a cross-connection between the irrigation and potable water supply.\n"
                    "- Industrial or Manufacturing Facilities: These properties may use chemicals, oils, or other substances that pose a higher risk of contamination, so more advanced backflow prevention devices are required.\n"
                    "- Multi-family Housing: Apartments or condos with shared water systems are more likely to need backflow preventer  testing to prevent cross-contamination between units.\n\n"
                    "There are a number of reasons why annual backflow testing is necessary and required:\n\n"
                    "- Ensure Water Safety: The primary reason for backflow preventer testing is to protect the public water supply from contamination. Any failure of a backflow preventer could lead to harmful chemicals, bacteria, or other contaminants entering the drinking water system.\n"
                    "- Meet Legal Requirements: Many local governments or water utilities require backflow testing annually to comply with health and safety regulations. Failing to comply with these regulations can lead to fines or penalties.\n"
                    "- Minimize Preventer Failure: Regular backflow preventer testing helps identify problems early, ensuring that any necessary repairs are done on a regular basis which can prolong costly backflow preventer replacement.\n"
                    "- Extend the Life of Your Backflow Preventer: Regular backflow maintenance and testing can help extend the life of your backflow preventer and reduce the likelihood of needing emergency repairs or replacement.\n\n"
                    "Backflow preventer devices failing inspection tests need to be repaired.\n\n"
                    "If a backflow preventer device fails the test, it needs to be repaired or replaced as soon as possible. Failing to do so could result in contamination of the water supply, which poses a health risk. Depending on the situation, the repair could involve cleaning the backflow preventer, replacing damaged parts, or installing a completely new backflow preventer device. In some cases, the device may need to be upgraded to meet current safety standards or local regulations.\n\n"
                    "Risk of significant liability, fines, water service disruptions and penalties for faulty backflow preventer devices posing serious risks to the public water supply.\n\n"
                    "If a backflow preventer device is faulty, damaged, or not functioning correctly, it can pose serious risks to the public water supply.\n\n"
                    "Contamination of the public water supply resulting from a faulty backflow preventer invites liability arising from negligence relating to failure to maintain, repair, or replace the backflow prevention device when necessary. In addition to public health risks, property owners or businesses can also be held liable for any damage caused by the contamination to neighboring properties, private plumbing systems, or the overall infrastructure of the water system.\n\n"
                    "Contamination of the water supply due to backflow can lead to dangerous health issues, costly repairs, and legal consequences. Property owners and businesses must stay on top of maintenance, inspections, and compliance with local regulations to avoid serious liabilities and penalties. Regular backflow preventer testing and prompt repairs are essential to ensuring the continued safety of the public water supply.\n\n"
                    "Many municipalities charge fines for failure to conduct regular backflow testing or for failing to maintain backflow preventer devices. These fines can range from a couple hundred to thousands of dollars, in addition to disruptions to your operations resulting from shut off the water supply. Willful negligence in backflow testing, repairing and protecting the public water supply in the event of a backflow incident could result in legal penalties and even criminal charges.\n\n"
                    "Conclusion:\n\n"
                    "Backflow prevention and annual testing are crucial to ensuring the safety of the public water supply. Regular testing helps to verify that backflow preventer assemblies are functioning correctly, prevents contamination, and ensures compliance with local regulations.\n\n"
                    "Whether for residential, commercial, or industrial systems, it’s important to maintain backflow preventer devices and ensure they are regularly tested to safeguard clean drinking water."
                )

        regulations = next(
            (
                section
                for section in payload["sections"]
                if section["kind"] == "link_list"
                and section.get("heading")
                == "Southern California Municipal Water Authority Backflow Testing Regulations"
            ),
            None,
        )
        if regulations:
            regulations["body"] = (
                "California municipal water authorities enforce strict requirements for backflow testing to ensure safe drinking water. Beginning July 1, 2025, CCCPH will be the primary standard enforced statewide.\n\n"
                "Under the regulatory guidelines of the Cross Connection Control Policy Handbook (CCCPH) which replaces Title 17 of the California Code of Regulations, the The American Water Works Association (AWWA) is the only agency recognized under new laws for backflow testing certification.\n\n"
                "The CCCPH aims to standardize how local water purveyors implement cross-connection control, improving public safety.\n\n"
                "The updated standards under the CCCPH clarifies installation heights, acceptable assemblies, testing frequencies, and recordkeeping requirements with more detail and consistency than Title 17. Agencies will now have clearer authority to mandate testing, repairs, and shutdowns for non-compliant properties. Agencies will now have clearer authority to mandate testing, repairs, and shutdowns for non-compliant properties\n\n"
                "Under the updated CCCPH regulatory guidelines every service connection to the water supply, including residential, will be evaluated for cross connection hazards. That means many homes may need backflow preventers installed. Property owners and contractors will need to stay current with annual testing and repairs, with increased scrutiny from water districts.\n\n"
                "AWWA Certified Backflow Prevention Testers knowledge and experience with installation and testing requirements and different types of backflow preventer devices ensure that your backflow intsallations, tests and repairs are compliant with State Water Board regulations, County Water Authority guidelines and Health Department regulations.\n\n"
                "County Health Department and Municipality Backflow Testing Requirements:\n\n"
                "With Backflow Test Pros' Managed Backflow Preventer Installation Testing & Maintenance service, there is no need to spend hours going over local water utility ordinances, requirements, deadlines, and fees, guidelines, reporting schedules and forms. Everything is Done for You to simply the backflow testing maintenance process and ensure compliance with local regulations"
            )
        return

    if path == "/backflow-repair-replacement-services":
        hero = first_section(payload, "hero")
        if hero:
            hero["body"] = (
                "Keeping backflow preventer devices in good working condition through timely repairs is required by law and ensures public safety, regulatory compliance, and the ongoing integrity of the water system. It’s essential that any damage or malfunction is addressed quickly to avoid any risk to water quality and public health.\n\n"
                "Backflow Test Pros backflow repair and replacement services provides timely backflow repair services and ensures that your water is not shut off due to leaking or damaged backflow assemblies."
            )
            payload["hero"] = hero

        repair_benefits = next(
            (
                section
                for section in payload["sections"]
                if section.get("sourceClass") == "backflow-repair-benefits"
            ),
            None,
        )
        if repair_benefits:
            repair_benefits["kind"] = "feature_cards"
            repair_benefits["heading"] = "Certified Technician Guaranteed Backflow Repair Compliance"
            repair_benefits["body"] = (
                "Backflow Test Pros is 100% dedicated to ensuring your business meets local water authority annual backflow repair and maintenance requirements so you can avoid civil penalties and ensure your water is not turned off for noncompliance."
            )
            repair_benefits["cards"] = [
                {
                    "title": "Licensed & Certified",
                    "body": "Licensed, Bonded & Insured\nUp to $2,000,000 per Job",
                    "icon": {
                        "src": "https://cdn.prod.website-files.com/67bfdff7943122ff2def874b/68350866fa20a387ad11d851_licensed%20certified%20Icon.svg",
                        "alt": "Licensed & Certified Backflow Test Specialists",
                    },
                },
                {
                    "title": "Expedited Repair Service",
                    "body": "Emergency Repair Replace\nServices Available",
                    "icon": {
                        "src": "https://cdn.prod.website-files.com/67bfdff7943122ff2def874b/68350866fa20a387ad11d84f_Expedited%20Service.svg",
                        "alt": "Expedited Backflow Repair Service",
                    },
                },
                {
                    "title": "Free Test Included",
                    "body": "Annual Backflow Testing\nIncluded with Your Repair",
                    "icon": {
                        "src": "https://cdn.prod.website-files.com/67bfdff7943122ff2def874b/68350866fa20a387ad11d852_Free%20Text%20Included.svg",
                        "alt": "Free Backjflow Test Included",
                    },
                },
                {
                    "title": "Best Value Pricing",
                    "body": "Multi-Year Backflow\nRepair Coverage Savings",
                    "icon": {
                        "src": "https://cdn.prod.website-files.com/67bfdff7943122ff2def874b/68350866fa20a387ad11d850_Money%20Icon.svg",
                        "alt": "Best Value Backflow Test Pricing",
                    },
                },
            ]
            repair_benefits["links"] = []

        repair_liability = next(
            (
                section
                for section in payload["sections"]
                if section["kind"] == "link_list"
                and section.get("heading") == "Timely Backflow Repair Helps Avoid Contamination Liabilities"
            ),
            None,
        )
        if repair_liability:
            repair_liability["body"] = (
                "If a backflow preventer device is found to be malfunctioning or damaged during testing, repairs must be made promptly to prevent potential contamination of the water supply.\n\n"
                "Delaying repairs to a backflow preventer device can potentially cause more severe and costly damage over time and can result in fines, water service disconnection, lawsuits, and potential liability for any damages caused by contamination.\n\n"
                "County Health Department and Municipality Backflow Repair Regulatory Guidelines:\n\n"
                "Don't risk letting your defective, leaking or broken backflow prevention assemblies trigger costly civil penalties and disruption of your business.\n\n"
                "As a bonded and insured licensed contractor, we offer peace of mind and guarantee top-tier workmanship. Whether you need routine testing or urgent repairs, our satisfaction guarantee ensures you receive the highest level of service at the most competitive rates."
            )

        guide = first_section(payload, "tabbed_content")
        if guide:
            guide["body"] = (
                "When backflow preventers are faulty, failing, or damaged, it’s important to address these issues promptly to avoid disruption of your water supply. Regular maintenance and testing by qualified our professionals can help identify and fix these common backflow repair issues before they lead to serious problems.\n\n"
                "As AWWA Certified backflow testers, cross connection control experts and commercial backflow specialists, we provide leading Southern California commercial clients managed turn-key backflow installation, testing and repair services to ensure compliance and and avoid costly repairs, fines and civil liabilities.\n\n"
                "For more detailed review of backflow repair and replacement issues please check our\n"
                "Backflow Repair & Replacement Frequently Asked Questions"
            )
            tabs = guide.get("tabs", [])
            if len(tabs) > 0:
                tabs[0]["body"] = (
                    "All approved backflow preventer assemblies have check valves and seals that prevent water from flowing in the wrong direction. Over time, these components can wear out or become damaged due to age, pressure changes, debris buildup, etc.\n\n"
                    "Common issues include:\n\n"
                    "- Worn seals: This can cause leaks around the valve, allowing water to pass through when it shouldn't, leading to potential contamination.\n"
                    "- Damaged check valves: If the check valve is cracked or malfunctioning, water can flow in reverse, bypassing the backflow prevention mechanism.\n"
                    "- Damaged check valve seats: The seat where the check valve aligns to seal off potential backflow is integral to the backflow preventer's integrity. In most cases these check valve seats are replaceable."
                )

        return

    if path == "/backflow-installation":
        hero = first_section(payload, "hero")
        if hero:
            hero["body"] = (
                "Backflow Test Pros specializes in the installation and certification testing of all backflow preventer devices.\n\n"
                "As a bonded and insured licensed contractor, we help you determine your regulatory requirements, assess hazard levels, select approved backflow prevention assemblies, conduct site preparation and perform the actual backflow device installation in a professional manner that ensures your regulatory compliance and provides the peace of mind you deserve.\n\n"
                "Free Backflow Test + Two Year Warranty Included"
            )
            payload["hero"] = hero

        install_benefits = next(
            (
                section
                for section in payload["sections"]
                if section["kind"] == "feature_cards"
                and "backflow-installation-benefits" in section.get("sourceClass", "")
            ),
            None,
        )
        if install_benefits:
            install_benefits["body"] = (
                "State regulations require that residential, commercial and industrial property owners install backflow prevention assemblies in various circumstances to protect the public water system from potential contamination. Backflow Test Pros is 100% dedicated to ensuring property owners meet backflow preventer installation requirements so you can avoid civil penalties and ensure your water is not turned off for noncompliance."
            )
            install_benefits["cards"] = [
                {
                    "title": "Backflow Installation Municipal Compliance",
                    "body": "Ensure you're fully compliant with specific city, county and water districts backflow prevention requirements",
                    "icon": install_benefits.get("cards", [{}])[0].get("icon"),
                },
                {
                    "title": "Backflow Installation Permit & Plan Approval",
                    "body": "Ensure your backflow assembly installation clears local permitting requirements and plans approvals",
                    "icon": install_benefits.get("cards", [{}, {}])[1].get("icon"),
                },
                {
                    "title": "Backflow Installation Approved Devices",
                    "body": "Ensure your installed backflow device is USC FCCCHR approved and meets hazard level requirements",
                    "icon": install_benefits.get("cards", [{}, {}, {}])[2].get("icon"),
                },
                {
                    "title": "Backflow Installation Free Testing & Certification",
                    "body": "Free initial backflow certification testing, same-day report submittal and backflow repair coverage",
                    "icon": install_benefits.get("cards", [{}, {}, {}, {}])[3].get("icon"),
                },
            ]

        pricing = first_section(payload, "pricing_tiles")
        if pricing:
            pricing["body"] = (
                "Backflow Test Pros specializes in the installation and certification testing of all backflow preventer devices from 1/2\"-10\" including: Reduced Pressure Principle, Double Check Valve, Pressure Vacuum Breakers, & Spill Resistant Vacuum Breakers.\n\n"
                "Our national, state and local municipality certified specialists provide the best value in backflow prevention installation, testing and repair services by combining competitive pricing with premium service and unmatched expertise.\n\n"
                "With priority scheduling, installation permitting, site preparation, documentation, hazard level assessment, approved backflow preventer device selection, functional validation testing, test report submission, same-day certification, and multi-device discounts; we provide the industry's premier backflow preventer installation services with included 2 year warranty and free testing at most competitive rates."
            )
            pricing["links"] = [
                {
                    "label": "Contact Us for Your Backflow Preventer Installation Quote",
                    "href": "/contact-backflowtestpros",
                    "external": False,
                    "target": "_blank",
                }
            ]

        guide = first_section(payload, "tabbed_content")
        if guide:
            guide["body"] = (
                "The installation and testing of backflow preventer devices are essential for ensuring the safety of the water supply and compliance with state and local regulations. Hiring a certified backflow professionals to perform backflow prevention assembly installation and testing is key to ensuring compliance with state and municipal water department regulations.\n\n"
                "As AWWA Certified backflow testers, cross connection control experts and commercial backflow specialists, we provide leading southern california commercial clients managed turn-key backflow installation, testing and repair services to ensure compliance and and avoid costly fines and civil liabilities.\n\n"
                "For a more detailed review of backflow prevention device installation and the importance of backflow preventer installation by licenced & certified backflow professionals please reference our\n"
                "Backflow Device Installation Frequently Asked Questions"
            )
            tabs = guide.get("tabs", [])
            if len(tabs) > 0:
                tabs[0]["body"] = (
                    "The first step in any backflow preventer device installation is determining the specific requirements for your property, system, and jurisdiction.\n\n"
                    "This involves a careful review of local plumbing codes, water district regulations, and any additional city or county ordinances that govern backflow prevention. Requirements can vary significantly depending on the type of water system you’re connecting to—whether it’s domestic potable water, irrigation, fire protection, or industrial processes.\n\n"
                    "A hazard level assessment must also be conducted to classify the property’s water system as low, moderate, or high hazard. This classification determines the type of backflow preventer device that must be installed.\n\n"
                    "For example, systems that handle chemicals, pesticides, or bodily fluids (such as those in medical or laboratory environments) are classified as high hazard and require more robust protection like a Reduced Pressure Zone Assembly (RPZ).\n\n"
                    "These and other factors must be considered before selecting the correct backflow preventer device and beginning installation.\n\n"
                    "Moreover, some backflow installation scenarios may require permitting. That said, not all municipalities explicitly require an backflow installation permit in all cases even though in many instances a separate permit for the installation of backflow preventer devices is indeed required.\n\n"
                    "If, for example, the installation involves work within the public right-of-way, such as connecting to the city water main or meter box, a separate permit from the Public Works Department is required.\n\n"
                    "Likewise, for existing buildings, the installation of a backflow preventer device may be required depending on the extent of remodeling and the potential for contamination to the public water supply.\n\n"
                    "If the installation is part of a larger plumbing project or involves modifications to the existing plumbing system, for instance, a plumbing permit or water quality permit may be necessary.\n\n"
                    "The process includes submitting plans for review and obtaining approval before installation.\n\n"
                    "Before commencing any installation, it's advisable to contact the particular municipality's Public Works or Building and Safety Division to determine the specific permits needed for your project."
                )
            if len(tabs) > 1:
                tabs[1]["body"] = (
                    "Once regulatory and site-specific requirements are understood, the next step is selecting the appropriate backflow prevention assembly.\n\n"
                    "The device must match the assessed hazard level of the system and be listed on an approved devices list, commonly issued by health departments or testing institutions like the University of Southern California's Foundation for Cross-Connection Control and Hydraulic Research (USC-FCCCHR).\n\n"
                    "Each municipality or water district has its own approved device list, installation standards conforming to standards established by the American Water Works Association (AWWA) and the Foundation for Cross-Connection Control and Hydraulic Research at the University of Southern California.\n\n"
                    "For high-hazard applications, such as those involving chemical use or systems with the potential for significant contamination, an RPZ assembly is typically required. RPZs provide the highest level of protection and include a relief valve to discharge any backflow.\n\n"
                    "For medium-hazard systems, such as standard irrigation without chemical injection, a Double Check Valve Assembly (DCVA) is often sufficient.\n\n"
                    "Systems at lower risk, like residential irrigation or hose bibs, may be protected using Pressure Vacuum Breakers (PVBs) or Atmospheric Vacuum Breakers (AVBs), though the latter cannot be subjected to continuous pressure.\n\n"
                    "Selecting the wrong device can result in a failed inspection or, worse, contamination of the potable water supply."
                )
            if len(tabs) > 3:
                tabs[3]["body"] = (
                    "In California, the installation of a Double Check Valve Assembly (DCVA) for backflow prevention is governed by the California Code of Regulations (CCR), and Cross Connection Policy Handbook. These assemblies are designed to prevent non-health hazard pollutants from entering the potable water supply due to backpressure or backsiphonage.\n\n"
                    "Typical Applications for DCV- Double Check Valve Backflow Devices\n\n"
                    "Double Check Valve Backflow Preventers are typically installed on fire sprinkler systems or on hazards that pose a low level threat to the water supply, which are called pollutants.\n\n"
                    "Typical applications include Fire Systems, and Main Lines for Homes posing minimal cross connection risk.\n\n"
                    "Statewide Installation Requirements\n\n"
                    "While specific requirements can vary by local jurisdiction, common installation practices include:\n\n"
                    "- Device Approval and Standards: DCVAs must conform to the American Water Works Association (AWWA) Standard C510 for Double Check Valve Backflow Prevention Assemblies.\n"
                    "- Installation Location and Orientation: The assembly should be installed as close as practical to the user's connection. Above-grade installation is preferred, though DCVAs may be installed below grade in a vault when they remain readily accessible for testing and maintenance.\n"
                    "- Accessibility and Clearances: Maintain adequate clearance around the device, typically a minimum of 12 inches on all sides, to facilitate maintenance and testing.\n\n"
                    "General Installation Guidelines\n\n"
                    "- Orientation: DCVAs are typically installed horizontally, as per manufacturer specifications.\n"
                    "- Protection from Freezing: In areas subject to freezing temperatures, protect the device with insulation or enclosures, ensuring that the relief valve discharge is not obstructed.\n"
                    "- Proper Drainage: Ensure that the installation site has adequate drainage to prevent water accumulation, especially if installed below grade.\n\n"
                    "Local Considerations\n\n"
                    "Local water agencies may have additional requirements:\n\n"
                    "- Permits and Inspections: Installation may require permits and must be inspected by the local water authority.\n"
                    "- Testing: Devices must be tested upon installation and annually thereafter by an AWWA certified backflow prevention assembly tester.\n\n"
                    "For a comprehensive understanding of backflow prevention installation requirements, refer to the California Code of Regulations, Cross Connection Control Policy Handbook, and consult with your local water authority or Call Backflow Test Pros for guidance on backflow device installation best practices."
                )
            if len(tabs) > 4:
                tabs[4]["body"] = (
                    "Proper site preparation is critical for a safe, compliant, and maintainable installation.\n\n"
                    "The location of the backflow preventer device must allow for required clearance and accessibility for annual testing, maintenance, and possible repairs.\n\n"
                    "Generally, at least 12 inches of clearance around the device is recommended, and the assembly must be installed at a minimum elevation, often 12 inches above grade or above the highest downstream outlet, depending on the device type.\n\n"
                    "RPZ assemblies, which have a relief valve that can discharge water under pressure, must be installed in locations that can accommodate drainage, such as above a floor drain or with a dedicated indirect waste line. When installing outdoors, the device should be protected from freezing temperatures using an insulated and ventilated enclosure or installed indoors if allowed by code.\n\n"
                    "Additionally, installers should ensure a solid and level mounting surface such as a concrete pad or wall bracket to support the device and prevent shifting or vibrations that could damage the assembly or connected piping.\n\n"
                    "In some cases, particularly for larger commercial systems, isolation valves and drain lines may also need to be pre-installed or planned for in advance."
                )
            county_tab_bodies = {
                9: (
                    "Backflow Test Pros provides the best value in Los Angeles County backflow prevention device installation services by combining competitive pricing with premium service and unmatched expertise.\n\n"
                    "Our national, state and local municipality certified specialists ensure regulatory compliance to deliver precision and reliability in every backflow device inspection, installation and replacement.\n\n"
                    "As a bonded and insured licensed contractor, we offer guaranteed quality workmanship with priority scheduling, 2-year warranty, same-day certification, repair coverage and multi-device discounts to help you meet your backflow installation, testing and maintenance compliance requirements.\n\n"
                    "Contact us to learn about our Los Angeles multi-device commercial backflow assembly installation offers in your area:"
                ),
                10: (
                    "Backflow Test Pros provides the best value in Orange County backflow prevention device installation services by combining competitive pricing with premium service and unmatched expertise.\n\n"
                    "Our national, state and local municipality certified specialists ensure regulatory compliance to deliver precision and reliability in every backflow device inspection, installation and replacement.\n\n"
                    "As a bonded and insured licensed contractor, we offer guaranteed quality workmanship with priority scheduling, 2-year warranty, same-day certification, repair coverage and multi-device discounts to help you meet your backflow installation, testing and maintenance compliance requirements.\n\n"
                    "Contact us to learn more about our Orange County multi-device commercial backflow assembly installation offers in your area:"
                ),
                11: (
                    "Backflow Test Pros provides the best value in San Diego County backflow prevention device installation services by combining competitive pricing with premium service and unmatched expertise.\n\n"
                    "Our national, state and local municipality certified specialists ensure regulatory compliance to deliver precision and reliability in every backflow device inspection, installation and replacement.\n\n"
                    "As a bonded and insured licensed contractor, we offer guaranteed quality workmanship with priority scheduling, 2-year warranty, same-day certification, repair coverage and multi-device discounts to help you meet your backflow installation, testing and maintenance compliance requirements.\n\n"
                    "Contact us to learn more about our San Diego multi-device commercial backflow assembly installation offers in your area:"
                ),
                12: (
                    "Backflow Test Pros provides the best value in San Bernardino County backflow prevention device installation services by combining competitive pricing with premium service and unmatched expertise.\n\n"
                    "Our national, state and local municipality certified specialists ensure regulatory compliance to deliver precision and reliability in every San Bernardino backflow device inspection, installation and replacement.\n\n"
                    "As a bonded and insured licensed contractor, we offer guaranteed quality workmanship with priority scheduling, 2-year warranty, same-day certification, repair coverage and multi-device discounts to help you meet your backflow installation, testing and maintenance compliance requirements.\n\n"
                    "Contact us to learn about our San Bernardino multi-device commercial backflow assembly installation offers in your area:"
                ),
                13: (
                    "Backflow Test Pros provides the best value in Riverside County backflow prevention device installation services by combining competitive pricing with premium service and unmatched expertise.\n\n"
                    "Our national, state and local municipality certified specialists ensure regulatory compliance to deliver precision and reliability in every Riverside backflow device inspection, installation and replacement.\n\n"
                    "As a bonded and insured licensed contractor, we offer guaranteed quality workmanship with priority scheduling, 2-year warranty, same-day certification, repair coverage and multi-device discounts to help you meet your backflow installation, testing and maintenance compliance requirements.\n\n"
                    "Contact us to learn about our Riverside County multi-device commercial backflow assembly installation offers in your area:"
                ),
                14: (
                    "Backflow Test Pros provides the best value in Ventura County backflow prevention device installation services by combining competitive pricing with premium service and unmatched expertise.\n\n"
                    "Our national, state and local municipality certified specialists ensure regulatory compliance to deliver precision and reliability in every Ventura backflow device inspection, installation and replacement.\n\n"
                    "As a bonded and insured licensed contractor, we offer guaranteed quality workmanship with priority scheduling, 2-year warranty, same-day certification, repair coverage and multi-device discounts to help you meet your backflow installation, testing and maintenance compliance requirements.\n\n"
                    "Contact us to learn about our Ventura County multi-device commercial backflow assembly installation offers in your area:"
                ),
            }
            for index, body in county_tab_bodies.items():
                if len(tabs) > index:
                    tabs[index]["body"] = body
            for tab in tabs:
                if tab.get("links"):
                    tab["links"] = normalize_local_link_items(tab["links"])

        regulations = next(
            (
                section
                for section in payload["sections"]
                if section["kind"] == "link_list"
                and section.get("heading") == "Municipal Water Authority Backflow Installation Regulations"
            ),
            None,
        )
        if regulations:
            regulations["body"] = (
                "Compliance with local backflow prevention regulations is governed by a combination of California State Water Resources Control Board guidelines, plumbing codes, Department of Public Health (CDPH) guidelines, and the specific ordinances and requirements set by local municipalities and water districts.\n\n"
                "Beginning July 1, 2025, CCCPH will be the primary standard enforced statewide reflecting the regulatory shift from Title 17 of the California Code of Regulations to the new Cross Connection Control Policy Handbook (CCCPH). CCCPH aims to standardize how local water purveyors implement cross-connection control, improving public safety. Agencies will now have clearer authority to mandate testing, repairs, and shutdowns for non-compliant properties.\n\n"
                "Under the new regulatory guidelines, American Water Works Association (AWWA) Certification is required and is the only agency recognized under new laws for backflow testing certification.\n\n"
                "County Health Department and Municipality Backflow Testing Requirements:\n\n"
                "With Backflow Test Pros' Managed Backflow Installation, Testing and Maintenance service, there is no need to spend hours going over local water utility ordinances, requirements, deadlines, and fees, guidelines, reporting schedules and forms. Everything is Done for You to simply the backflow installation, testing and maintenance process and ensure compliance with local regulations."
            )


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
    rewrite_city_landing_copy(payload)
    return payload


def build_service_area_hub_payload(
    payload: dict[str, Any],
    row: dict[str, str],
    *,
    city_counts: dict[str, int],
) -> dict[str, Any]:
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
    county_slug = county_slug_from_special_slug(payload["slug"])
    county_name = COUNTY_NAMES.get(county_slug, "")
    payload.update(
        {
            "countySlug": county_slug,
            "countyName": county_name,
            "hubScope": county_name or "Southern California",
            "quickLinks": quick_links,
            "cityLinks": city_links,
        }
    )
    if county_name:
        rewrite_county_service_area_hub_copy(
            payload,
            county_name=county_name,
            city_count=city_counts.get(county_slug, 0),
        )
    else:
        rewrite_root_service_area_hub_copy(payload, city_counts=city_counts)
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
    apply_homepage_copy_overrides(payload)
    return payload


def apply_homepage_copy_overrides(payload: dict[str, Any]) -> None:
    if payload.get("path") != "/":
        return

    hero = first_section(payload, "hero")
    pricing = first_section(payload, "pricing_tiles")
    if hero:
        hero["body"] = (
            "Backflow Test Pros' commitment to precision, reliability, and regulatory compliance has made us the preferred choice for businesses that demand the highest standards in state, county and municipal mandated backflow prevention testing and repairs.\n\n"
            "As a CA State Licensed Contractor, AWWA Certified Backflow tester and AWWA Certified Cross Connection Control Specialists, we manage your backflow testing backflow installation and backflow repair compliance requirements so you can avoid legal liability, civil penalties and ensure that the water service to your home or commercial property is not disrupted for non-compliance."
        )
        payload["hero"] = hero

    credentials = next(
        (
            section
            for section in payload["sections"]
            if section["kind"] == "link_list"
            and "certifiedby-city-water-departments" in section.get("sourceClass", "")
        ),
        None,
    )
    if credentials:
        credentials["body"] = (
            "Under the regulatory guidelines of the Cross Connection Control Policy Handbook (CCCPH) which replaces Title 17 of the California Code of Regulations, the American Water Works Association (AWWA) is the only agency recognized under new laws for backflow testing certification.\n\n"
            "Backflow Test Pros is AWWA Certified Backflow Tester and Approved Cross-Connect Specialist + Certified Backflow Testers with County Health Departments across Southern California. As a CA State Licensed Contractor and AWWA Cross Connection Control Specialists, our team of experienced backflow experts work with County Health Departments and Municipal Water Departments throughout Southern California to protect our water and prevent backflow contamination."
        )

    proof_strip = first_section(payload, "rich_text")
    if proof_strip:
        proof_strip["body"] = "\n".join(HOMEPAGE_PROOF_ITEMS)

    premium_service = first_section(payload, "feature_cards")
    if premium_service:
        premium_service["body"] = (
            "State regulations require that residential, commercial and industrial customers served by a public water system take adequate measures to protect the public water system from potential contamination. Backflow Test Pros is 100% dedicated to ensuring your business meets local water authority annual backflow testing and repair requirements so you can avoid civil penalties and ensure your water is not turned off for noncompliance."
        )
        premium_service["cards"] = [
            {
                "title": "Priority Scheduling",
                "body": "Schedule in advance to ensure convenient backflow test time and water authority certification",
                "icon": premium_service.get("cards", [{}])[0].get("icon"),
            },
            {
                "title": "City Documents Retrieval",
                "body": "Save time and avoid the headache of finding your city backflow prevention test certification letter",
                "icon": premium_service.get("cards", [{}, {}])[1].get("icon"),
            },
            {
                "title": "Repair Coverage",
                "body": "Avoid costly disruptions to your business operations with the Backflow Test Pros  backflow repair coverage",
                "icon": premium_service.get("cards", [{}, {}, {}])[2].get("icon"),
            },
            {
                "title": "Same-Day Certification",
                "body": "Document your backflow prevention test status with automated same day water authority certification",
                "icon": premium_service.get("cards", [{}, {}, {}, {}])[3].get("icon"),
            },
        ]
        premium_service["links"] = [
            {
                "label": "Contact Us to Lock Your 2026 Pricing!",
                "href": "/contact-backflowtestpros",
                "external": False,
                "target": "_blank",
            }
        ]

    if pricing:
        pricing["body"] = (
            "We provide the best value in backflow preventer installation testing and repair services by combining competitive pricing with premium service and unmatched expertise. Our national, state and local municipality certified specialists ensure regulatory compliance to deliver precision and reliability in every inspection. As a bonded and insured licensed contractor, we offer peace of mind while guaranteeing top-tier workmanship. With priority scheduling, same-day certification, and a multi-device discount, we take care of your backflow preventer installation testing and maintenance needs so you can focus on running your business.\n\n"
            "Whether you need routine testing or urgent repairs, our satisfaction guarantee ensures you receive the highest level of service at the most competitive rates."
        )
        pricing["tiles"] = [
            {
                "price": "$99",
                "title": "Residential Testing Value Package",
                "detail": "Call to Schedule",
            },
            {
                "price": "$99",
                "title": "Multi-Device Testing Bundle",
                "detail": "Request Pricing *",
            },
            {
                "price": "$159",
                "title": "Commercial Testing Value Package",
                "detail": "Managed Service",
            },
        ]

    services = next(
        (
            section
            for section in payload["sections"]
            if section["kind"] == "link_list"
            and "backflow-prevention-services" in section.get("sourceClass", "")
        ),
        None,
    )
    if services:
        services["body"] = (
            "In order to protect our drinking water quality, and safety, backflow prevention assemblies are utilized to prevent unclean or contaminated water from entering the potable domestic water system. California state law, county health board regulations and local municipal codes require that approved backflow preventer be installed, tested, and repaired by licensed and certified backflow testers.\n\n"
            "As a county and local water authority certified backflow tester, and CA licensed contractor, Backflow Test Pros is committed to providing you the best service at the industry's most competitive prices to help you avoid civil penalties and keep your water turned on."
        )
        services["items"] = HOMEPAGE_SERVICE_ITEMS


def build_about_payload(payload: dict[str, Any]) -> dict[str, Any]:
    feature_section = first_section(payload, "feature_cards")
    tab_sections = collect_sections(payload, "tabbed_content")
    payload.update(
        {
            "featureCards": feature_section.get("cards", []) if feature_section else [],
            "tabGroups": [section.get("tabs", []) for section in tab_sections],
        }
    )
    apply_about_page_copy_overrides(payload)
    return payload


def apply_about_page_copy_overrides(payload: dict[str, Any]) -> None:
    if payload.get("path") != "/about-us":
        return

    hero = first_section(payload, "hero")
    if hero:
        hero["body"] = (
            "As a water authority certified backflow tester, cross connect specialist, and bonded + insured CA licensed contractor, Backflow Test Pros simplifies backflow testing installation and repair compliance process by helping homeowners and responsible businesses avoid violations and noncompliance when backflow preventer devices are tested installed and repaired..\n\n"
            "With a reputation built on expertise, integrity and customer satisfaction, we provide affordable, backflow testing and repair services and manage every step of the local water authority compliance process in an otherwise complicated and time consuming process to ensure your residential or commercial property meets national, state and municipal compliance requirements."
        )
        payload["hero"] = hero

    mission = next(
        (
            section
            for section in payload["sections"]
            if section["kind"] == "rich_text"
            and section.get("heading") == "Dedicated to Protecting Southern California's Public Water Resource"
        ),
        None,
    )
    if mission:
        mission["body"] = (
            "Backflow Test Pros is a proudly owned and operated family business started in 2019 by John and Steve Stoeckel. The expansion into backflow services was the natural progression of our success as landscape irrigation specialists. From the beginning, we joined forces to pursue a goal of more exacting standards and greater professionalism to the backflow prevention industry.\n\n"
            "Since then our company has grown to provide backflow installation, testing and repair services to leading commercial clients and residential communities across Southern California.\n\n"
            "Throughout our expansion, we’ve never strayed from our founding values of integrity, honesty, and customer service. Knowing that the security of our public water resource relies on the integrity of our service drives us to pursue excellence daily.\n\n"
            "We are dedicated to best of class service and draw on the deep expertise of our invaluable team to deliver the best value in backflow prevention services. This dedication to daily excellence is reflected in our satisfaction guaranteed service, competitive prices, installation warranty and complementary repair coverage.\n\n"
            "As California licensed plumbers and American Water Works Association certified backflow testers and cross connect specialists, Backflow Test Pros is 100% dedicated to helping commercial and residential clients throughout Southern California meet backflow prevention compliance requirements.\n\n"
            "We take great pride in protecting Southern California's water resources. Moreover, we recognize that our success is achieved one customer at a time.\n\n"
            "Looking to the decade ahead, we thank you for the opportunity to serve as your preferred backflow prevention installation, testing and repair partner."
        )

    credentials = next(
        (
            section
            for section in payload["sections"]
            if section["kind"] == "rich_text"
            and section.get("heading") == "AWWA Certified Backflow Testers Cross Connection Control Specialists"
        ),
        None,
    )
    if credentials:
        credentials["body"] = (
            "As a CA State Licensed Contractor and AWWA Cross Connection Control Specialists, our team of experienced backflow experts work with County Health Departments and Municipal Water Departments throughout Southern California to protect our water and prevent backflow contamination."
        )

    proof_strip = next(
        (
            section
            for section in payload["sections"]
            if section["kind"] == "rich_text"
            and section.get("sourceClass") == "marquee-simple-item"
        ),
        None,
    )
    if proof_strip:
        proof_strip["body"] = "\n".join(HOMEPAGE_PROOF_ITEMS)

    tabs_section = first_section(payload, "tabbed_content")
    if tabs_section:
        tabs_section["body"] = ""
        tabs = tabs_section.get("tabs", [])
        for tab in tabs:
            tab["title"] = tab.get("label", tab.get("title", ""))
        if len(tabs) > 0:
            tabs[0]["body"] = (
                "No matter what the type and size of your backflow preventer devices, Backflow Test Pros' certified backflow specialized technicians have the knowledge and experience to ensure your backflow preventer devices are properly tested to meet local water authority backflow prevention test compliance requirements.\n\n"
                "From obtaining and deciphering your annual water department backflow test report letters to communicating your test results with the local water authority and ensuring your backflow test compliance is documented before due dates, we manage your backflow test prevention compliance process so you can focus on your business.\n\n"
                "We specialize in delivering managed, hassel-free backflow maintenance services to the leading commercial clients in Southern California. Our managed turn-key backflow installation, testing and repair services ensure that your backflow preventer assemblies are in compliance and that you avoid costly fines and civil liabilities.\n\n"
                "- Professional, Hassel-Free Service\n"
                "- Everything Done for You\n"
                "- Availability Outside Business Hours\n"
                "- Multi-Device Test Discounts\n"
                "- Advanced Scheduling\n"
                "- Due Date Monitoring\n"
                "- Fire Line Test Mode Assistance\n"
                "- Water Authority Documentation\n"
                "- Discounted Cage\n"
                "- Free Backflow Preventer Lock\n"
                "- 24/7 Backflow Expert Support\n"
                "- Up to $500 Repair Credit"
            )
            tabs[0]["links"] = [
                {
                    "label": "Backflow Testing Services",
                    "href": "/backflow-testing",
                    "external": False,
                    "target": "_blank",
                }
            ]

    managed_maintenance = first_section(payload, "bullet_columns")
    if managed_maintenance:
        managed_maintenance["body"] = (
            "Backflow Test Pros provides dedicated support in everything from initial scheduling, water department communications, due date tracking, same day approval, routine maintenance and urgent repairs.\n\n"
            "As a Backflow Test Pros client you can rest assured knowing that your backflows assemblies are monitored and compliant with local water authority regulations.\n\n"
            "Backflow Test Pros Turn-key Backflow Maintenance includes:"
        )


def build_contact_payload(payload: dict[str, Any]) -> dict[str, Any]:
    contact_form = first_section(payload, "form_section")
    if contact_form:
        contact_form["fields"] = [
            {
                "label": "First name",
                "name": "first-name-2",
                "fieldType": "input",
                "inputType": "text",
                "placeholder": "First name",
                "required": True,
                "options": [],
            },
            {
                "label": "Last name",
                "name": "last-name-2",
                "fieldType": "input",
                "inputType": "text",
                "placeholder": "Last name",
                "required": True,
                "options": [],
            },
            {
                "label": "Company / property name",
                "name": "company_name",
                "fieldType": "input",
                "inputType": "text",
                "placeholder": "Company, HOA, or property name",
                "required": False,
                "options": [],
            },
            {
                "label": "Phone",
                "name": "phone",
                "fieldType": "input",
                "inputType": "tel",
                "placeholder": "(555) 555-5555",
                "required": True,
                "options": [],
            },
            {
                "label": "Email",
                "name": "email-field-2",
                "fieldType": "input",
                "inputType": "email",
                "placeholder": "you@email-provider.com",
                "required": True,
                "options": [],
            },
            {
                "label": "Anything else we should know?",
                "name": "Message-Field-4",
                "fieldType": "textarea",
                "inputType": "textarea",
                "placeholder": "Optional notes like notice letters, failed tests, access details, or scheduling needs.",
                "required": False,
                "options": [],
            },
        ]

    payload.update(
        {
            "contactForm": contact_form,
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
    city_counts = county_city_counts(url_rows)
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
            payload = build_service_area_hub_payload(payload, row, city_counts=city_counts)
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
