"""Stage 2: journal covers from publisher homepages (og:image / cover <img>).

For each journal without a Wikipedia cover, fetch the publisher's journal page
with a browser UA, look for (a) an og:image meta tag, (b) an <img> whose
src/alt mentions cover/journal, and download the best candidate into
site/public/logos/papers/. Publishers behind hard bot-walls will fail — those
get reported for manual handling.
"""
from __future__ import annotations

import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

import requests

OUT = Path(__file__).resolve().parents[1] / "public" / "logos" / "papers"
UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

SOURCES = {
    "journal-of-financial-economics": "https://www.sciencedirect.com/journal/journal-of-financial-economics",
    "journal-of-empirical-finance": "https://www.sciencedirect.com/journal/journal-of-empirical-finance",
    "journal-of-economic-theory": "https://www.sciencedirect.com/journal/journal-of-economic-theory",
    "journal-of-econometrics": "https://www.sciencedirect.com/journal/journal-of-econometrics",
    "review-of-financial-studies": "https://academic.oup.com/rfs",
    "review-of-economic-studies": "https://academic.oup.com/restud",
    "quantitative-finance": "https://www.tandfonline.com/journals/rquf20",
    "financial-analysts-journal": "https://www.tandfonline.com/journals/ufaj20",
    "mathematical-finance": "https://onlinelibrary.wiley.com/journal/14679965",
    "journal-of-political-economy": "https://www.journals.uchicago.edu/journals/jpe",
    "review-of-economics-and-statistics": "https://direct.mit.edu/rest",
    "journal-of-financial-data-science": "https://www.pm-research.com/content/iijjfds",
    "journal-of-risk": "https://www.risk.net/journal-of-risk",
    "journal-of-computational-finance": "https://www.risk.net/journal-of-computational-finance",
    "ieee-transactions-on-signal-processing": "https://signalprocessingsociety.org/publications-resources/ieee-transactions-signal-processing",
}

OG_RE = re.compile(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', re.I)
OG_RE2 = re.compile(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', re.I)
IMG_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>', re.I)


def candidates(html: str, base: str) -> list[str]:
    out: list[str] = []
    for rx in (OG_RE, OG_RE2):
        out += [urljoin(base, m) for m in rx.findall(html)]
    for src in IMG_RE.findall(html):
        low = src.lower()
        if "cover" in low or "journal" in low:
            out.append(urljoin(base, src))
    seen: set[str] = set()
    return [c for c in out if not (c in seen or seen.add(c))]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    missing: list[str] = []
    for slug, page in SOURCES.items():
        try:
            time.sleep(1.0)
            r = requests.get(page, headers=UA, timeout=45, allow_redirects=True)
            if r.status_code != 200:
                missing.append(f"{slug}  (page HTTP {r.status_code})")
                continue
            got = False
            for url in candidates(r.text, r.url)[:4]:
                try:
                    time.sleep(0.5)
                    img = requests.get(url, headers={**UA, "Referer": r.url}, timeout=45)
                    ctype = img.headers.get("content-type", "")
                    if img.status_code == 200 and ctype.startswith("image/") and len(img.content) > 2500:
                        ext = ctype.split("/")[1].split(";")[0].replace("jpeg", "jpg")
                        if ext not in {"png", "jpg", "gif", "webp", "svg+xml"}:
                            continue
                        ext = "svg" if ext.startswith("svg") else ext
                        (OUT / f"{slug}.{ext}").write_bytes(img.content)
                        print(f"OK    {slug:42s} {len(img.content)//1024:5d} KB  {url[:90]}")
                        got = True
                        break
                except requests.RequestException:
                    continue
            if not got:
                missing.append(f"{slug}  (no downloadable cover among candidates)")
        except Exception as exc:  # noqa: BLE001
            missing.append(f"{slug}  ({exc})")
    if missing:
        print("\nSTILL MISSING:")
        for m in missing:
            print(f"  - {m}")
        sys.exit(1)


if __name__ == "__main__":
    main()
