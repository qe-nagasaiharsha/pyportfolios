"""Convert the new Fortitudo logo (pale sisal mark on a dark anthracite field)
into a transparent, tightly-cropped PNG for the dark footer.

Light-on-dark and high-contrast, so alpha comes straight from luminance (bright =
opaque mark, dark = transparent field). Every visible pixel is painted the exact
theme sisal so there's no grey anti-alias halo on the near-black footer.
"""

from PIL import Image

SRC = r"C:\Users\Yonishwari\Downloads\FORTITUDO LOGO PALE SISAL ON ANTHRACITE  BACKGROUND.jpg"
OUT = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site\public\logos\fortitudo-horizontal.png"
SISAL = (244, 242, 232)  # --color-sisal #f4f2e8

im = Image.open(SRC).convert("RGB")
L = im.convert("L")
w, h = L.size

# alpha = (lum - LO) ramped to (HI); field ~dark -> 0, mark ~pale -> 255.
LO, HI = 45.0, 130.0
px = L.load()
alpha = Image.new("L", (w, h), 0)
ap = alpha.load()
for y in range(h):
    for x in range(w):
        a = (px[x, y] - LO) * (255.0 / (HI - LO))
        ap[x, y] = 0 if a <= 0 else (255 if a >= 255 else int(a))

out = Image.new("RGBA", (w, h), SISAL + (0,))
solid = Image.new("RGBA", (w, h), SISAL + (255,))
out = Image.composite(solid, out, alpha)

# Tight crop by ink profile (a column/row needs enough solid pixels to count),
# so the mark sits flush to the image edges.
mask = alpha.point(lambda a: 255 if a >= 120 else 0)
mp = mask.load()
MIN = 4
col = [0] * w
row = [0] * h
for y in range(h):
    for x in range(w):
        if mp[x, y]:
            col[x] += 1
            row[y] += 1
xs = [x for x in range(w) if col[x] >= MIN]
ys = [y for y in range(h) if row[y] >= MIN]
if xs and ys:
    out = out.crop((xs[0], ys[0], xs[-1] + 1, ys[-1] + 1))

out.save(OUT)
print("src", im.size, "-> saved", OUT, "size", out.size)
