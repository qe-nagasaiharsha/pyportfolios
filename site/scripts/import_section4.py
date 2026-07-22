# -*- coding: utf-8 -*-
"""Import the section-4 (Portfolio Optimization & Asset Allocation) book covers."""
import os, sys
from PIL import Image
sys.stdout.reconfigure(encoding="utf-8")

SRC = r"C:\Users\Yonishwari\Downloads\book covers section 04-20260617T143647Z-3-001\book covers section 04"
DST = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site\public\covers"

MAP = [
    ("01 bodie.jpg",         "bodie-investments.jpg"),
    ("02 luenenberger.jpg",  "luenberger-investment-science.jpg"),
    ("03 ang.jpg",           "ang-asset-management.jpg"),
    ("04 grinold.jpeg",      "grinold-active-portfolio-management.jpg"),
    ("05 roncalli.jpg",      "roncalli-introduction-to-risk-parity-and-budgeti.jpg"),
    ("06 meucci.jpg",        "meucci-risk-and-asset-allocation.jpg"),
    ("07 fabozzi.jpg",       "fabozzi-robust-portfolio-optimization-and-manage.jpg"),
]

for src_name, dst_name in MAP:
    sp = os.path.join(SRC, src_name)
    if not os.path.exists(sp):
        print("MISSING SOURCE:", src_name); continue
    im = Image.open(sp).convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.getchannel("A"))
    bg.save(os.path.join(DST, dst_name), "JPEG", quality=90)
    print(f"{src_name:22} -> {dst_name:52} {bg.size[0]}x{bg.size[1]}")
print("done")
