# -*- coding: utf-8 -*-
"""Record each cover's intrinsic pixel size into books_clean.json (coverW/coverH)
so the card can reserve the exact aspect ratio — uniform width, true height, no
stretch, no layout shift."""
import json, os, sys
from PIL import Image
sys.stdout.reconfigure(encoding="utf-8")
ROOT = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site"
COVERS = os.path.join(ROOT, "public", "covers")
CLEAN = os.path.join(ROOT, "scripts", "books_clean.json")
data = json.load(open(CLEAN, encoding="utf-8"))
n = 0; ratios = []
for g in data:
    for b in g["books"]:
        if not b.get("cover"):
            b.pop("coverW", None); b.pop("coverH", None); continue
        p = os.path.join(COVERS, b["cover"])
        try:
            with Image.open(p) as im:
                w, h = im.size
            b["coverW"] = w; b["coverH"] = h; n += 1; ratios.append(round(h / w, 2))
        except Exception as e:
            print("ERR", b["cover"], e)
json.dump(data, open(CLEAN, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"recorded dims for {n} covers")
print("height/width ratios range:", min(ratios), "to", max(ratios))
from collections import Counter
print("ratio spread:", dict(sorted(Counter(ratios).items())))
