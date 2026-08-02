"""Check whether images are big enough to use as article heroes.

The hero renders full-bleed at 3200x1419 (aspect 2.2551), so anything narrower
than 3200px has to be upscaled — which is what makes a photo look soft next to
the natively-sized ones. This reports, per file, whether it clears that bar and
how much height a crop to the hero ratio would cost.

Usage:
    python site/scripts/check_hero_images.py                       # scans Downloads
    python site/scripts/check_hero_images.py <folder-or-file> ...  # scans what you name
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image

HERO_W, HERO_H = 3200, 1419
HERO_ASPECT = HERO_W / HERO_H
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}

DEFAULT = Path.home() / "Downloads"


def collect(targets: list[str]) -> list[Path]:
    paths: list[Path] = []
    for t in targets:
        p = Path(t)
        if p.is_dir():
            paths += [f for f in sorted(p.iterdir()) if f.suffix.lower() in EXTS]
        elif p.is_file():
            paths.append(p)
        else:
            print(f"  ! not found: {p}")
    return paths


def main() -> int:
    targets = sys.argv[1:] or [str(DEFAULT)]
    files = collect(targets)
    if not files:
        print("No images found.")
        return 0

    print(f"Hero target: {HERO_W}x{HERO_H}  (aspect {HERO_ASPECT:.4f})\n")
    print(f"{'FILE':46} {'SIZE':>12} {'ASPECT':>7} {'UPSCALE':>8}  VERDICT")
    print("-" * 100)

    ok = 0
    for f in files:
        try:
            with Image.open(f) as im:
                w, h = im.size
        except Exception as exc:                       # not an image, or unreadable
            print(f"{f.name[:46]:46} {'-':>12} {'-':>7} {'-':>8}  unreadable ({type(exc).__name__})")
            continue

        scale = HERO_W / w
        crop_h = round(w / HERO_ASPECT)
        if h >= crop_h:
            fit = f"crop {h - crop_h}px off height"
        else:
            fit = f"TOO SHORT by {crop_h - h}px"

        if scale <= 1.0 and h >= crop_h:
            verdict, ok = f"good - {fit}", ok + 1
        elif scale <= 1.15:
            verdict = f"borderline - {fit}"
        else:
            verdict = f"TOO SMALL - needs {scale:.1f}x upscale"

        print(f"{f.name[:46]:46} {f'{w}x{h}':>12} {w/h:>7.3f} {scale:>7.2f}x  {verdict}")

    print("-" * 100)
    print(f"{ok} of {len(files)} usable at full hero size without upscaling.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
