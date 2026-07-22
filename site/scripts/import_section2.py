# -*- coding: utf-8 -*-
"""Import the section-2 (Fixed Income) book covers: convert each to a flattened
JPEG over the existing public/covers/<slug>.jpg so literature.ts keeps its refs."""
import os, sys
from PIL import Image
sys.stdout.reconfigure(encoding="utf-8")

SRC = r"C:\Users\Yonishwari\Downloads\book covers section 02-20260615T155732Z-3-001\book covers section 02"
DST = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site\public\covers"

MAP = [
    ("01 fabozzi.jpg",  "fabozzi-fixed-income-analysis.jpg"),
    ("02 tuckman.jpg",  "tuckman-fixed-income-securities.jpg"),
    ("03 veronesi.jpg", "veronesi-fixed-income-securities.jpg"),
    ("04 rebonato.jpg", "rebonato-bond-pricing-and-yield-curve-modeling.jpg"),
    ("05 brigo.jpg",    "brigo-interest-rate-models.jpg"),
]

for src_name, dst_name in MAP:
    sp = os.path.join(SRC, src_name)
    if not os.path.exists(sp):
        print("MISSING SOURCE:", src_name); continue
    im = Image.open(sp).convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.getchannel("A"))
    bg.save(os.path.join(DST, dst_name), "JPEG", quality=90)
    print(f"{src_name:16} -> {dst_name:52} {bg.size[0]}x{bg.size[1]}")
print("done")
