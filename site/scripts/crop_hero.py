"""Crop the hero photo to a shorter band so the hero + ticker fit one screen.
Top is trimmed down to just above the leftmost peak; a little is taken off the
bottom. Saved as a new file (original kept). Tune TOP_FRAC / BOT_FRAC and re-run.
"""

from PIL import Image

SRC = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site\public\hero-original.png"
OUT = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site\public\hero-framed.png"

TOP_FRAC = 0.17  # fraction trimmed from the TOP (down to the red-line / above the peak)
BOT_FRAC = 0.00  # keep the full bottom (foreground)

im = Image.open(SRC)
w, h = im.size
top = int(round(h * TOP_FRAC))
bot = int(round(h * BOT_FRAC))
cropped = im.crop((0, top, w, h - bot))
cropped.save(OUT)
print(f"src {w}x{h}  top -{top}px  bottom -{bot}px  -> {cropped.size}  ratio {cropped.size[0]/cropped.size[1]:.3f}")
