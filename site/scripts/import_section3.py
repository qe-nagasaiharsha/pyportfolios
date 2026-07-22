# -*- coding: utf-8 -*-
"""Import the section-3 (Derivatives, Options & Volatility) book covers."""
import os, sys
from PIL import Image
sys.stdout.reconfigure(encoding="utf-8")

SRC = r"C:\Users\Yonishwari\Downloads\book covers section 03-20260615T155736Z-3-001\book covers section 03"
DST = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site\public\covers"

MAP = [
    ("01 hull.jpg",        "hull-options-futures-and-other-derivatives.jpg"),
    ("02 natenberg.jpg",   "natenberg-option-volatility-and-pricing.jpg"),
    ("03 taleb.jpg",       "taleb-dynamic-hedging.jpg"),
    ("04 wilmott.jpg",     "wilmott-paul-wilmott-on-quantitative-finance.jpg"),
    ("05 gatheral.jpg",    "gatheral-the-volatility-surface.jpg"),
    ("06 bergomi.jpg",     "bergomi-stochastic-volatility-modeling.jpg"),
    ("07 glasserman.webp", "glasserman-monte-carlo-methods-in-financial-engi.jpg"),
]

for src_name, dst_name in MAP:
    sp = os.path.join(SRC, src_name)
    if not os.path.exists(sp):
        print("MISSING SOURCE:", src_name); continue
    im = Image.open(sp).convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.getchannel("A"))
    bg.save(os.path.join(DST, dst_name), "JPEG", quality=90)
    print(f"{src_name:20} -> {dst_name:50} {bg.size[0]}x{bg.size[1]}")
print("done")
