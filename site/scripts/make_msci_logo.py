"""Convert the new MSCI JPEG (dark mark on a near-white field) into a transparent
PNG for the white provider card. High-contrast, so a simple luminance key cleanly
removes the background while keeping the mark's original colours; edges feather.
"""

from PIL import Image

SRC = r"C:\Users\Yonishwari\Downloads\msci logo.jpeg"
OUT = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site\public\logos\indices\msci.png"

im = Image.open(SRC).convert("RGB")
L = im.convert("L")
w, h = L.size

# Background = bright field. Key out pixels brighter than HI; keep those darker
# than LO fully; feather in between.
HI, LO = 236, 208
px = L.load()
alpha = Image.new("L", (w, h), 0)
ap = alpha.load()
for y in range(h):
    for x in range(w):
        v = px[x, y]
        if v >= HI:
            a = 0
        elif v <= LO:
            a = 255
        else:
            a = int(round((HI - v) * 255 / (HI - LO)))
        ap[x, y] = a

out = im.convert("RGBA")
out.putalpha(alpha)

bbox = alpha.getbbox()
if bbox:
    pad = 6
    l, t, r, b = bbox
    out = out.crop((max(0, l - pad), max(0, t - pad), min(w, r + pad), min(h, b + pad)))

out.save(OUT)
print("saved", OUT, "size", out.size)
