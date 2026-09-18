#!/usr/bin/env python3
"""Verify Tina backend values reflect at exact public frontend field locations.

This guard exists because broad substring checks can pass when stale/static text
contains the backend text as a prefix (for example backend `About Us` vs public
`About Usfsdfgsdfds`). It compares selected Tina values to exact rendered DOM
positions/classes used by the copied mockup templates.
"""
from __future__ import annotations

import json
import os
import re
import sys
from html import unescape
from html.parser import HTMLParser
from pathlib import Path

import requests

SITE = os.environ.get("SITE_URL", "https://firstfornews.net").rstrip("/")
CLIENT_ID = (
    os.environ.get("NEXT_PUBLIC_TINA_CLIENT_ID")
    or os.environ.get("PUBLIC_TINA_CLIENT_ID")
    or os.environ.get("TINA_PUBLIC_CLIENT_ID")
    or "a9684e57-12db-4e1e-81bb-c908941e164f"
)
BRANCH = os.environ.get("NEXT_PUBLIC_TINA_BRANCH") or os.environ.get("TINA_BRANCH") or "main"
TOKEN = os.environ.get("NEXT_PUBLIC_TINA_TOKEN") or os.environ.get("TINA_PUBLIC_TINA_TOKEN") or os.environ.get("TINA_TOKEN") or ""
TINA_URL = f"https://content.tinajs.io/2.4/content/{CLIENT_ID}/github/{BRANCH}"


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack: list[dict] = []
        self.matches: list[tuple[str, str, str]] = []
        self.capture: list[dict] = []

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        classes = set((attr.get("class") or "").split())
        self.stack.append({"tag": tag, "attrs": attr, "classes": classes})

        parent_classes = set()
        if len(self.stack) >= 2:
            parent_classes = self.stack[-2]["classes"]

        # Exact mockup field locations.
        key = None
        if tag == "b" and "ph-k" in parent_classes:
            key = "hero_eyebrow"
        elif tag == "h1":
            key = "hero_headline"
        elif tag == "h2":
            key = "section_title"

        if key:
            self.capture.append({"key": key, "tag": tag, "depth": len(self.stack), "text": []})

    def handle_endtag(self, tag):
        if self.capture and self.capture[-1]["tag"] == tag and self.capture[-1]["depth"] == len(self.stack):
            item = self.capture.pop()
            text = normalize("".join(item["text"]))
            self.matches.append((item["key"], tag, text))
        if self.stack:
            self.stack.pop()

    def handle_data(self, data):
        if self.capture:
            self.capture[-1]["text"].append(data)


def load_env_file() -> None:
    for candidate in [Path(".env"), Path.home() / ".hermes" / ".env"]:
        if not candidate.exists():
            continue
        for line in candidate.read_text(errors="ignore").splitlines():
            if "=" not in line or line.strip().startswith("#"):
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def normalize(value: object) -> str:
    text = unescape(str(value or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tina_query(query: str, variables: dict) -> dict:
    headers = {"content-type": "application/json", "User-Agent": "HermesDynamicReflectionVerify"}
    if TOKEN:
        headers["X-API-KEY"] = TOKEN
    response = requests.post(TINA_URL, json={"query": query, "variables": variables}, headers=headers, timeout=30)
    response.raise_for_status()
    payload = response.json()
    if payload.get("errors"):
        raise RuntimeError(json.dumps(payload["errors"], indent=2))
    return payload["data"]


def extract_frontend_values(html: str) -> dict[str, list[str]]:
    parser = TextExtractor()
    parser.feed(html)
    values: dict[str, list[str]] = {}
    for key, _tag, text in parser.matches:
        values.setdefault(key, []).append(text)
    return values


CHECKS = [
    {
        "name": "about-page",
        "path": "/about/",
        "variables": {"relativePath": "about.mdx"},
        "query": """
        query Page($relativePath: String!) {
          page(relativePath: $relativePath) {
            blocks { __typename ... on PageBlocksAboutMockup17 { hero { eyebrow headline } purpose { title } } }
          }
        }
        """,
        "expected": lambda data: {
            "hero_eyebrow": data["page"]["blocks"][0]["hero"]["eyebrow"],
            "hero_headline": data["page"]["blocks"][0]["hero"]["headline"],
            "section_title": data["page"]["blocks"][0]["purpose"]["title"],
        },
    },
    {
        "name": "contact-page",
        "path": "/contact/",
        "variables": {"relativePath": "contact.mdx"},
        "query": """
        query Page($relativePath: String!) {
          page(relativePath: $relativePath) {
            blocks { __typename ... on PageBlocksContactMockup17 { hero { eyebrow headline } formSection { title } } }
          }
        }
        """,
        "expected": lambda data: {
            "hero_eyebrow": data["page"]["blocks"][0]["hero"]["eyebrow"],
            "hero_headline": data["page"]["blocks"][0]["hero"]["headline"],
            "section_title": data["page"]["blocks"][0]["formSection"]["title"],
        },
    },
    {
        "name": "team-page",
        "path": "/our-team/",
        "variables": {"relativePath": "our-team.mdx"},
        "query": """
        query Page($relativePath: String!) {
          page(relativePath: $relativePath) {
            blocks { __typename ... on PageBlocksOurTeamMockup17 { hero { eyebrow headline } leadership { title } } }
          }
        }
        """,
        "expected": lambda data: {
            "hero_eyebrow": data["page"]["blocks"][0]["hero"]["eyebrow"],
            "hero_headline": data["page"]["blocks"][0]["hero"]["headline"],
            "section_title": data["page"]["blocks"][0]["leadership"]["title"],
        },
    },
]


def main() -> int:
    load_env_file()
    ok = True
    session = requests.Session()
    session.headers.update({"Cache-Control": "no-cache", "Pragma": "no-cache", "User-Agent": "HermesDynamicReflectionVerify"})

    for check in CHECKS:
        data = tina_query(check["query"], check["variables"])
        expected = {k: normalize(v) for k, v in check["expected"](data).items() if normalize(v)}
        html = session.get(f"{SITE}{check['path']}?v=dynamic-reflection-verify", timeout=30).text
        actual = extract_frontend_values(html)
        failures = []
        for key, expected_value in expected.items():
            actual_values = actual.get(key, [])
            if expected_value not in actual_values:
                failures.append((key, expected_value, actual_values))
        status = "OK" if not failures else "FAIL"
        print(f"{check['name']} {status}")
        for key, expected_value in expected.items():
            print(f"  backend {key}: {expected_value}")
            print(f"  frontend {key}: {actual.get(key, [])}")
        if failures:
            ok = False
            print("  mismatches:")
            for key, expected_value, actual_values in failures:
                print(f"    - {key}: expected exact {expected_value!r}, got {actual_values!r}")

    print(f"DYNAMIC_REFLECTION_OK {ok}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
