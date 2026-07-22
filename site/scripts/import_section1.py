# -*- coding: utf-8 -*-
"""Import the section-1 (Foundations) book covers the client supplied: convert
each (jpg/webp/avif) to a flattened JPEG and write it over the existing
public/covers/<slug>.jpg so literature.ts keeps referencing the same filenames."""
import os, sys
from PIL import Image
sys.stdout.reconfigure(encoding="utf-8")

SRC = r"C:\Users\Yonishwari\Downloads\book covers section 01-20260617T115251Z-3-001\book covers section 01"
DST = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site\public\covers"

MAP = [
    ("01 baxter.jpg",      "baxter-financial-calculus.jpg"),
    ("02 joshi.jpg",       "joshi-the-concepts-and-practice-of-mathematical-.jpg"),
    ("03 shreve.jpg",      "shreve-stochastic-calculus-for-finance-ii.jpg"),
    ("04 björk.jpg",       "bj-rk-arbitrage-theory-in-continuous-time.jpg"),
    ("05 karatzas.webp",   "karatzas-brownian-motion-and-stochastic-calculus.jpg"),
    ("06 casella.jpg",     "casella-statistical-inference.jpg"),
    ("07 tsay.jpg",        "tsay-analysis-of-financial-time-series.jpg"),
    ("08 hamilton.jpg",    "hamilton-time-series-analysis.jpg"),
    ("09 ross.avif",       "ross-a-first-course-in-probability.jpg"),
    ("10 blitzstein.jpg",  "blitzstein-introduction-to-probability.jpg"),
    ("11 campbell.jpg",    "campbell-the-econometrics-of-financial-markets.jpg"),
    ("12 greene.jpg",      "greene-econometric-analysis.jpg"),
]

for src_name, dst_name in MAP:
    sp = os.path.join(SRC, src_name)
    if not os.path.exists(sp):
        print("MISSING SOURCE:", src_name); continue
    im = Image.open(sp).convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.getchannel("A"))
    bg.save(os.path.join(DST, dst_name), "JPEG", quality=90)
    print(f"{src_name:22} -> {dst_name:50} {bg.size[0]}x{bg.size[1]}")
print("done")
