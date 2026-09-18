#!/usr/bin/env python3
"""Verify First For News sitemap dynamic data + SEO output.

Guard for the /sitemap/ route: compares Tina backend page/post collections to
live public sitemap DOM and checks SEO/meta output. This prevents the sitemap
from becoming a static/stale list after style/template changes.
"""
from __future__ import annotations

import json
import os
import re
from html import unescape
from html.parser import HTMLParser
from pathlib import Path

import requests


def load_env_file() -> None:
    for candidate in [Path(".env"), Path.home() / ".hermes" / ".env"]:
        if not candidate.exists():
            continue
        for line in candidate.read_text(errors="ignore").splitlines():
            if "=" not in line or line.strip().startswith("#"):
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()

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

QUERY = """
query SitemapEntries {
  pageConnection {
    edges { node { title permalink seo { metaTitle noindex } _sys { filename } } }
  }
  blogConnection {
    edges { node { title permalink pubDate seo { metaTitle noindex } _sys { filename } } }
  }
}
"""


class LinkCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self._href: str | None = None
        self._text: list[str] = []
        self.meta: dict[str, str] = {}
        self.title_text = ""
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        if tag == "a" and attr.get("href"):
            self._href = attr["href"]
            self._text = []
        if tag == "title":
            self._in_title = True
        if tag == "meta":
            key = attr.get("name") or attr.get("property")
            content = attr.get("content")
            if key and content:
                self.meta[str(key)] = str(content)

    def handle_endtag(self, tag):
        if tag == "a" and self._href:
            text = normalize("".join(self._text))
            if text:
                self.links.append((self._href, text))
            self._href = None
            self._text = []
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._href:
            self._text.append(data)
        if self._in_title:
            self.title_text += data


def normalize(value: object) -> str:
    return re.sub(r"\s+", " ", unescape(str(value or ""))).strip()


def with_slash(value: str) -> str:
    if not value or value == "/":
        return "/"
    value = value if value.startswith("/") else "/" + value
    return value if value.endswith("/") else value + "/"


def page_url(node: dict) -> str:
    filename = node.get("_sys", {}).get("filename") or ""
    if filename == "home":
        return "/"
    permalink = node.get("permalink") or filename
    return with_slash(permalink)


def post_url(node: dict) -> str:
    permalink = node.get("permalink") or node.get("_sys", {}).get("filename") or ""
    return with_slash(permalink)


def tina_query() -> dict:
    headers = {"content-type": "application/json", "User-Agent": "HermesSitemapVerify"}
    if TOKEN:
        headers["X-API-KEY"] = TOKEN
    response = requests.post(TINA_URL, json={"query": QUERY}, headers=headers, timeout=30)
    response.raise_for_status()
    payload = response.json()
    if payload.get("errors"):
        raise RuntimeError(json.dumps(payload["errors"], indent=2))
    return payload["data"]


def main() -> int:
    data = tina_query()
    backend_pages = [edge["node"] for edge in data.get("pageConnection", {}).get("edges", []) if edge.get("node")]
    backend_posts = [edge["node"] for edge in data.get("blogConnection", {}).get("edges", []) if edge.get("node")]

    expected_pages = []
    for node in backend_pages:
        filename = node.get("_sys", {}).get("filename") or ""
        url = page_url(node)
        if filename in {"404", "sitemap"} or url == "/sitemap/" or node.get("seo", {}).get("noindex"):
            continue
        expected_pages.append((url, normalize(node.get("title") or node.get("seo", {}).get("metaTitle") or filename)))

    expected_posts = []
    for node in backend_posts:
        if node.get("seo", {}).get("noindex"):
            continue
        expected_posts.append((post_url(node), normalize(node.get("title") or node.get("seo", {}).get("metaTitle") or node.get("_sys", {}).get("filename"))))

    html = requests.get(f"{SITE}/sitemap/?v=sitemap-dynamic-verify", headers={"Cache-Control": "no-cache", "User-Agent": "HermesSitemapVerify"}, timeout=30).text
    parser = LinkCollector()
    parser.feed(html)
    live_links = {(with_slash(href) if href.startswith("/") else with_slash("/" + href.replace(SITE, "").lstrip("/")), text) for href, text in parser.links if not href.startswith("#")}
    live_text = normalize(re.sub(r"<[^>]+>", " ", html))

    failures: list[str] = []
    # Check all pages, and a representative sample of posts to keep output readable.
    for url, text in expected_pages:
        if (url, text) not in live_links:
            failures.append(f"missing page link {url} {text!r}")
    for url, text in expected_posts[:10]:
        if (url, text) not in live_links:
            failures.append(f"missing post link {url} {text!r}")

    if "Sitemap | First For News" not in normalize(parser.title_text):
        failures.append(f"bad <title>: {parser.title_text!r}")
    if "Browse the public pages and latest reporting published by First For News." not in parser.meta.get("description", ""):
        failures.append("missing sitemap meta description")
    if "ffn-demo-sitemap" not in html or "sitemap-panel" not in html or "Big Shoulders Display" not in html:
        failures.append("missing First For News sitemap branding markers")
    if f">{len(expected_pages)}<" not in html or f">{len(expected_posts)}<" not in html:
        failures.append("dynamic page/post counts not rendered")
    if "Tina content collections" not in live_text:
        failures.append("dynamic source note missing")

    print("BACKEND_PAGE_COUNT", len(expected_pages))
    print("BACKEND_POST_COUNT", len(expected_posts))
    print("LIVE_LINK_COUNT", len(live_links))
    for url, text in expected_pages[:8]:
        print("EXPECT_PAGE", url, text)
    for url, text in expected_posts[:5]:
        print("EXPECT_POST", url, text)

    if failures:
        print("SITEMAP_DYNAMIC_OK False")
        for failure in failures:
            print("FAIL", failure)
        return 1
    print("SITEMAP_DYNAMIC_OK True")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
