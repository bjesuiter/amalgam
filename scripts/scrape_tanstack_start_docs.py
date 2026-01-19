#!/usr/bin/env python3
"""
Scraper for TanStack Start documentation.
https://tanstack.com/start/latest/docs/framework/react/overview

Run with:
    uv run --with crawl4ai python scripts/scrape_tanstack_start_docs.py

If Playwright browsers are missing:
    uv run --with crawl4ai playwright install
"""

import asyncio
import re
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

from crawl4ai import AsyncWebCrawler, CacheMode, CrawlerRunConfig
from crawl4ai.deep_crawling import BFSDeepCrawlStrategy
from crawl4ai.deep_crawling.filters import DomainFilter, FilterChain, URLPatternFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator

BASE_URL = "https://tanstack.com/start/latest/docs/framework/react/overview"
OUTPUT_DIR = Path("docs/tanstack/start")
MAX_DEPTH = 6
MAX_PAGES = 200


def normalize_file_name(source_url: str) -> Path:
    """Convert a URL to a relative markdown file path."""
    parsed = urlparse(source_url)
    # Remove /start/latest/docs/ prefix from path
    path = re.sub(r"^/start/latest/docs/?", "", parsed.path)
    path = path.rstrip("/")
    if not path:
        path = "index"
    # Clean special characters, keep path structure
    cleaned = re.sub(r"[^a-zA-Z0-9/_-]", "_", path)
    return Path(f"{cleaned}.md")


def extract_markdown(result) -> Optional[str]:
    """Extract markdown content from a crawl result."""
    markdown = getattr(result, "markdown", None)
    if markdown is None:
        return None
    if isinstance(markdown, str):
        return markdown
    raw_markdown = getattr(markdown, "raw_markdown", None)
    if raw_markdown:
        return raw_markdown
    return getattr(markdown, "markdown", None)


async def run() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    base_prefix = "https://tanstack.com/start/latest/docs"

    filter_chain = FilterChain(
        [
            DomainFilter(allowed_domains=["tanstack.com"]),
            URLPatternFilter(patterns=["*start/latest/docs*"]),
        ]
    )

    crawl_config = CrawlerRunConfig(
        deep_crawl_strategy=BFSDeepCrawlStrategy(
            max_depth=MAX_DEPTH,
            max_pages=MAX_PAGES,
            include_external=False,
            filter_chain=filter_chain,
        ),
        markdown_generator=DefaultMarkdownGenerator(content_source="cleaned_html"),
        cache_mode=CacheMode.BYPASS,
        stream=True,
        verbose=True,
    )

    written = set()

    try:
        async with AsyncWebCrawler() as crawler:
            async for result in await crawler.arun(url=BASE_URL, config=crawl_config):
                url = getattr(result, "url", None)
                if not url:
                    continue
                if not url.startswith(base_prefix):
                    continue

                markdown = extract_markdown(result)
                if not markdown:
                    continue

                relative_path = normalize_file_name(url)
                file_path = OUTPUT_DIR / relative_path
                if file_path in written:
                    continue

                file_path.parent.mkdir(parents=True, exist_ok=True)
                file_path.write_text(markdown, encoding="utf-8")
                written.add(file_path)
                print(f"  -> {file_path}")
    except Exception as exc:
        message = str(exc)
        if "Playwright" in message or "playwright" in message:
            hint = (
                "Playwright browser binaries are missing. Run "
                "`uv run --with crawl4ai playwright install` and retry."
            )
            raise RuntimeError(hint) from exc
        raise

    print(f"\nWrote {len(written)} markdown files to {OUTPUT_DIR}.")


if __name__ == "__main__":
    asyncio.run(run())
