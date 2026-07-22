"""Fetch journal cover/logo images for the Papers shelf.

Wikipedia's pageimages API skips non-free files (most journal covers are
fair-use), so instead we list each page's images via action=parse, pick the
cover-looking file, resolve its URL with imageinfo, and download it. Throttled
+ retried to stay under Wikipedia's rate limits. Journals that still fail are
reported for manual fetch from the publisher.
Output: site/public/logos/papers/<slug>.<ext>
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import requests

OUT = Path(__file__).resolve().parents[1] / "public" / "logos" / "papers"
API = "https://en.wikipedia.org/w/api.php"
HEADERS = {"User-Agent": "pyportfolios-logo-fetch/1.0 (contact: site build script)"}
DELAY = 2.0  # seconds between API calls

# slug -> Wikipedia page title
JOURNALS = {
    "journal-of-finance": "The Journal of Finance",
    "journal-of-financial-economics": "Journal of Financial Economics",
    "econometrica": "Econometrica",
    "journal-of-portfolio-management": "The Journal of Portfolio Management",
    "review-of-financial-studies": "The Review of Financial Studies",
    "journal-of-risk": "Journal of Risk",
    "quantitative-finance": "Quantitative Finance (journal)",
    "mathematical-finance": "Mathematical Finance (journal)",
    "journal-of-political-economy": "Journal of Political Economy",
    "journal-of-empirical-finance": "Journal of Empirical Finance",
    "journal-of-economic-theory": "Journal of Economic Theory",
    "journal-of-econometrics": "Journal of Econometrics",
    "financial-analysts-journal": "Financial Analysts Journal",
    "review-of-economic-studies": "The Review of Economic Studies",
    "bell-journal-of-economics": "The Bell Journal of Economics",
    "review-of-economics-and-statistics": "The Review of Economics and Statistics",
    "quarterly-journal-of-economics": "The Quarterly Journal of Economics",
    "journal-of-financial-data-science": "The Journal of Financial Data Science",
    "journal-of-business": "The Journal of Business",
    "notices-of-the-ams": "Notices of the American Mathematical Society",
    "journal-of-computational-finance": "Journal of Computational Finance",
    "ieee-transactions-on-signal-processing": "IEEE Transactions on Signal Processing",
}

# generic wiki furniture we never want
SKIP_FRAGMENTS = (
    "commons-logo", "wiki letter", "question book", "edit-clear", "ambox",
    "symbol", "increase", "decrease", "folder", "open_access", "openaccess",
    "lock", "crossref", "star", "barnstar", "p_vip", "portal",
)
IMG_EXTS = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg")


def api_get(params: dict) -> dict:
    """GET with throttle + backoff on 429/503."""
    for attempt in range(5):
        time.sleep(DELAY)
        r = requests.get(API, params=params, headers=HEADERS, timeout=30)
        if r.status_code in (429, 503):
            time.sleep(10 * (attempt + 1))
            continue
        r.raise_for_status()
        return r.json()
    raise RuntimeError("rate-limited after retries")


def list_page_images(title: str) -> list[str]:
    data = api_get({"action": "parse", "page": title, "prop": "images", "redirects": 1, "format": "json"})
    return data.get("parse", {}).get("images", [])


def pick_cover(files: list[str]) -> str | None:
    """Prefer files that look like a cover/masthead; fall back to first clean image."""
    def clean(f: str) -> bool:
        low = f.lower()
        return low.endswith(IMG_EXTS) and not any(s in low for s in SKIP_FRAGMENTS)

    candidates = [f for f in files if clean(f)]
    if not candidates:
        return None
    for f in candidates:
        low = f.lower()
        if "cover" in low or "front" in low or "masthead" in low:
            return f
    return candidates[0]


def file_url(filename: str) -> str | None:
    data = api_get({
        "action": "query", "titles": f"File:{filename}",
        "prop": "imageinfo", "iiprop": "url", "format": "json",
    })
    for page in data.get("query", {}).get("pages", {}).values():
        info = page.get("imageinfo")
        if info:
            return info[0]["url"]
    return None


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    missing: list[str] = []
    for slug, title in JOURNALS.items():
        try:
            files = list_page_images(title)
            chosen = pick_cover(files)
            if not chosen:
                missing.append(f"{slug}  ({title}: no usable image among {len(files)} files)")
                continue
            url = file_url(chosen)
            if not url:
                missing.append(f"{slug}  ({title}: no URL for {chosen})")
                continue
            ext = url.rsplit(".", 1)[-1].lower()
            dest = OUT / f"{slug}.{ext}"
            time.sleep(DELAY)
            img = requests.get(url, headers=HEADERS, timeout=60)
            img.raise_for_status()
            dest.write_bytes(img.content)
            print(f"OK    {slug:44s} {len(img.content)//1024:5d} KB  {chosen}")
        except Exception as exc:  # noqa: BLE001 — report and continue
            missing.append(f"{slug}  ({title}: {exc})")
    if missing:
        print("\nNEEDS MANUAL FETCH:")
        for m in missing:
            print(f"  - {m}")
        sys.exit(1)


if __name__ == "__main__":
    main()
