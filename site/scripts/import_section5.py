# -*- coding: utf-8 -*-
"""Import the section-5 (Risk Management) book covers."""
import os, sys
from PIL import Image
sys.stdout.reconfigure(encoding="utf-8")

SRC = r"C:\Users\Yonishwari\Downloads\book covers section 05-20260617T182505Z-3-001\book covers section 05"
DST = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site\public\covers"

MAP = [
    ("01 hull.jpg",       "hull-risk-management-and-financial-institutions.jpg"),
    ("02 crouhy.jpg",     "crouhy-the-essentials-of-risk-management.jpg"),
    ("03 mcneil.jpg",     "mcneil-quantitative-risk-management.jpg"),
    ("04 cherubini.jpg",  "cherubini-copula-methods-in-finance.jpg"),
    ("05 alexander.webp", "alexander-market-risk-analysis.jpg"),
]

for src_name, dst_name in MAP:
    sp = os.path.join(SRC, src_name)
    if not os.path.exists(sp):
        print("MISSING SOURCE:", src_name); continue
    im = Image.open(sp).convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.getchannel("A"))
    bg.save(os.path.join(DST, dst_name), "JPEG", quality=90)
    print(f"{src_name:20} -> {dst_name:54} {bg.size[0]}x{bg.size[1]}")
print("done")
