# -*- coding: utf-8 -*-
"""Import the section-6 (Market Microstructure & Execution) book covers."""
import os, sys
from PIL import Image
sys.stdout.reconfigure(encoding="utf-8")

SRC = r"C:\Users\Yonishwari\Downloads\book covers section 06-20260617T190709Z-3-001\book covers section 06"
DST = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site\public\covers"

MAP = [
    ("01 harris.jpg",   "harris-trading-and-exchanges.jpg"),
    ("02 ohara.jpg",    "o-hara-market-microstructure-theory.jpg"),
    ("03 foucault.jpg", "foucault-market-liquidity.jpg"),
]

for src_name, dst_name in MAP:
    sp = os.path.join(SRC, src_name)
    if not os.path.exists(sp):
        print("MISSING SOURCE:", src_name); continue
    im = Image.open(sp).convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.getchannel("A"))
    bg.save(os.path.join(DST, dst_name), "JPEG", quality=90)
    print(f"{src_name:18} -> {dst_name:42} {bg.size[0]}x{bg.size[1]}")
print("done")
