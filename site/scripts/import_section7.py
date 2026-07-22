# -*- coding: utf-8 -*-
"""Import the section-7 (Algorithmic Trading & Machine Learning) book covers,
update books_clean.json cover slugs + dimensions for that section."""
import os, sys, json
from PIL import Image
sys.stdout.reconfigure(encoding="utf-8")

ROOT = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site"
SRC = r"C:\Users\Yonishwari\Downloads\book covers section 07-20260618T162013Z-3-001\book covers section 07"
DST = os.path.join(ROOT, "public", "covers")
JSON_PATH = os.path.join(ROOT, "scripts", "books_clean.json")

# source filename -> (book index in section 7 [1-based], destination slug)
MAP = [
    ("01 chan.jpg",     1,  "chan-quantitative-trading.jpg"),
    ("02 chan.jpg",     2,  "chan-algorithmic-trading.jpg"),
    ("03 carver.jpg",   3,  "carver-systematic-trading.jpg"),
    ("04 kissel.jpg",   4,  "kissell-algorithmic-trading-methods.jpg"),
    ("05 hilpisch.jpg", 5,  "hilpisch-python-for-finance.jpg"),
    ("06 hilpisch.jpg", 6,  "hilpisch-python-for-algorithmic-trading.jpg"),
    ("07 strimpel.jpg", 7,  "strimpel-python-for-algorithmic-trading-cookbook.jpg"),
    ("08 jansen.jpg",   8,  "jansen-machine-learning-for-algorithmic-trading.jpg"),
    ("09 dixon.jpg",    9,  "dixon-machine-learning-in-finance.jpg"),
    ("10 lopez.webp",   10, "l-pez-de-prado-advances-in-financial-machine-lea.jpg"),
    ("11 lopez.jpg",    11, "lopez-de-prado-machine-learning-for-asset-managers.jpg"),
]

data = json.load(open(JSON_PATH, encoding="utf-8"))
grp = next(g for g in data if "Algorithmic Trading & Machine" in g["theme"])

for src_name, idx, slug in MAP:
    sp = os.path.join(SRC, src_name)
    if not os.path.exists(sp):
        print("MISSING SOURCE:", src_name); continue
    im = Image.open(sp).convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.getchannel("A"))
    out = os.path.join(DST, slug)
    bg.save(out, "JPEG", quality=90)
    w, h = bg.size
    book = grp["books"][idx - 1]
    book["cover"] = slug
    book["coverW"] = w
    book["coverH"] = h
    print(f"{src_name:16} -> [{idx:2}] {slug:55} {w}x{h}  ({book['author']})")

json.dump(data, open(JSON_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("books_clean.json updated")
