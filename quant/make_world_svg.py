# =============================================================================
# Build the Geographies world map as an inline SVG React component.
#
# WHY THIS EXISTS
#
# The map used to be site/public/world-reach.png — Louis's artwork from slide 14
# of the deck. It looked right, but the legend beneath it ("Developed (10):
# Australia, Canada, ...") was painted into the pixels, so nobody could select
# it, copy it, search it with Ctrl+F, or hear it read out by a screen reader.
# Harsha asked for the map to be embedded in the page in the sense that its text
# is real text (8 Sep 2026).
#
# So the shapes are redrawn here as <path> elements and the legend is emitted as
# ordinary HTML next to them. The SVG carries no text at all: HTML selection is
# reliable in every browser, whereas dragging across SVG <text> nodes is not.
#
# MATCHING THE ARTWORK
#
# This is a redraw of a brand asset, so it has to land on top of the original
# rather than merely look world-shaped. Two things were measured off the PNG
# rather than guessed:
#
#   projection  Fitted by rendering candidate projections and scoring each
#               against the artwork's own land mask (intersection-over-union).
#               Equirectangular 0.849, Miller 0.562, Mercator 0.343 — so the
#               artwork is equirectangular, with latitude linearly stretched
#               about 10% against longitude. VIEW_W/VIEW_H reproduce that
#               stretch, which is why the aspect here is 2.358 and not the
#               2.585 a geographically neat equirectangular map would give.
#
#   palette     Sampled from the PNG: sisal ground, #dcdcdc for countries we do
#               not cover, #151515 solid for developed, and a #0a0f1e diagonal
#               hatch for emerging whose period and 75%-dark duty cycle were
#               measured along a cut through Russia. The stripes lean "/" —
#               measured in 4px steps, because a coarser step aliases against
#               the 17.6px horizontal period and reads as the opposite lean.
#
# Run:  python quant/make_world_svg.py
# =============================================================================

import io
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GEOJSON = os.path.join(HERE, "data", "world-110m.geojson")
OUT = os.path.join(ROOT, "site", "src", "components", "brand", "GeographiesMap.tsx")

# --- framing, measured off world-reach.png -----------------------------------
# The artwork's map ink occupies x 24..3399, y 26..1457 of a 3423x1848 canvas.
VIEW_W, VIEW_H = 3375, 1431
LAT_N, LAT_S = 83.7, -55.6          # data bounds with Antarctica dropped
SKIP = {"Antarctica"}

# --- palette, sampled off world-reach.png ------------------------------------
C_GROUND = "#f4f2e8"                # sisal, the card behind the map
C_PLAIN = "#dcdcdc"                 # countries outside the fifteen
C_DEVELOPED = "#151515"             # anthracite
C_HATCH = "#0a0f1e"                 # emerging-market hatch stroke
C_BORDER = "#ffffff"

HATCH_PERIOD = 12.4                 # perpendicular to the stripes
HATCH_DARK = 0.75                   # duty cycle measured across Russia

# The fifteen: (GeoJSON name, display name, nominal GDP in USD trillions).
#
# The first entry must match the GeoJSON feature name, which is not always the
# display name — "United States of America". GDP is IMF World Economic Outlook
# 2026, which is a projection rather than an outturn; that is why every surface
# showing these says "IMF WEO 2026 est." rather than stating them as settled.
#
# These ride onto the shaded paths as data attributes, so the hover tooltip
# reads them straight off the DOM and needs no data module of its own.
DEVELOPED = [
    ("United States of America", "United States", 32.38),
    ("Germany", "Germany", 5.45),
    ("Japan", "Japan", 4.38),
    ("United Kingdom", "United Kingdom", 4.26),
    ("France", "France", 3.60),
    ("Italy", "Italy", 2.74),
    ("Canada", "Canada", 2.51),
    ("Australia", "Australia", 2.12),
    ("Spain", "Spain", 2.09),
    ("South Korea", "South Korea", 1.93),
]
EMERGING = [
    ("China", "China", 20.85),
    ("India", "India", 4.15),
    ("Russia", "Russia", 2.66),
    ("Brazil", "Brazil", 2.64),
    ("Mexico", "Mexico", 2.12),
]


def project(lon, lat):
    """Equirectangular, stretched vertically to match the artwork."""
    x = (lon + 180.0) / 360.0 * VIEW_W
    y = (LAT_N - lat) / (LAT_N - LAT_S) * VIEW_H
    return x, y


def num(v):
    """Trim coordinates to one decimal; drop a trailing '.0'."""
    s = "%.1f" % v
    return s[:-2] if s.endswith(".0") else s


def unwrap(ring):
    """Make a ring's longitudes continuous.

    Natural Earth stores Russia's mainland and Fiji as single rings that step
    straight from +180 to -180 rather than being split at the antimeridian.
    Drawn literally, that step is just another straight edge and it streaks a
    band right across the map — Russia's was 40 degrees of latitude tall. Here
    the jump is undone, so the ring simply keeps heading east past 180.
    """
    out = []
    prev = None
    for lon, lat in ring:
        if prev is not None:
            while lon - prev > 180.0:
                lon -= 360.0
            while prev - lon > 180.0:
                lon += 360.0
        out.append((lon, lat))
        prev = lon
    return out


def clip_strip(pts):
    """Sutherland-Hodgman clip against the visible strip, lon -180..180."""
    def half(poly, edge, keep_ge):
        out = []
        for i in range(len(poly)):
            cur, prv = poly[i], poly[i - 1]
            cin = cur[0] >= edge if keep_ge else cur[0] <= edge
            pin = prv[0] >= edge if keep_ge else prv[0] <= edge
            if cin != pin and cur[0] != prv[0]:
                t = (edge - prv[0]) / (cur[0] - prv[0])
                out.append((edge, prv[1] + t * (cur[1] - prv[1])))
            if cin:
                out.append(cur)
        return out

    pts = half(pts, -180.0, True)
    if len(pts) < 3:
        return []
    return half(pts, 180.0, False)


def ring_pieces(ring):
    """One ring -> the piece(s) of it that actually fall on the map.

    A ring that crosses the antimeridian is drawn twice, once shifted a full
    turn, and each copy clipped to the strip — so Russia's far east reappears on
    the left-hand edge beside Alaska instead of being dragged back across Asia.
    """
    pts = unwrap(ring)
    lons = [p[0] for p in pts]
    if min(lons) >= -180.0 and max(lons) <= 180.0:
        return [pts]

    pieces = []
    for shift in (0.0, -360.0, 360.0):
        moved = [(lon + shift, lat) for lon, lat in pts]
        if min(p[0] for p in moved) > 180.0 or max(p[0] for p in moved) < -180.0:
            continue
        clipped = clip_strip(moved)
        if len(clipped) >= 3:
            pieces.append(clipped)
    return pieces


def to_path(pts):
    """One closed subpath, dropping points that round to the same place."""
    out = []
    prev = None
    for lon, lat in pts:
        x, y = project(lon, lat)
        pt = (num(x), num(y))
        if pt != prev:
            out.append(pt)
            prev = pt
    if len(out) < 3:
        return ""
    head = "M%s %s" % out[0]
    rest = "".join("L%s %s" % p for p in out[1:])
    return head + rest + "Z"


def feature_path(feature):
    geom = feature["geometry"]
    coords = geom["coordinates"]
    polys = coords if geom["type"] == "MultiPolygon" else [coords]
    parts = []
    for poly in polys:
        for ring in poly:          # ring 0 is the outline, the rest are holes
            for piece in ring_pieces(ring):
                d = to_path(piece)
                if d:
                    parts.append(d)
    return "".join(parts)


def main():
    with io.open(GEOJSON, encoding="utf-8") as fh:
        geo = json.load(fh)

    # geo name -> (fill, display name, group, gdp)
    fills = {}
    for name, label, gdp in DEVELOPED:
        fills[name] = (C_DEVELOPED, label, "Developed", gdp)
    for name, label, gdp in EMERGING:
        fills[name] = ("url(#wm-hatch)", label, "Emerging", gdp)

    # Every one of the fifteen must actually be found in the boundaries, or a
    # market would silently render unshaded and nobody would notice.
    present = {f["properties"].get("name") for f in geo["features"]}
    missing = sorted(n for n in fills if n not in present)
    if missing:
        raise SystemExit("not in the boundary data: %s" % ", ".join(missing))

    plain, marked = [], []
    for feature in geo["features"]:
        name = feature["properties"].get("name")
        if name in SKIP:
            continue
        d = feature_path(feature)
        if not d:
            continue
        # Shaded countries are emitted last so their borders sit on top.
        if name in fills:
            marked.append((name, d, fills[name]))
        else:
            plain.append((name, d, None))

    lines = []
    for name, d, info in plain:
        lines.append('        <path d="%s" fill="%s" />' % (d, C_PLAIN))
    for name, d, info in marked:
        fill, label, group, gdp = info
        # The tooltip reads these off the hovered node, so no data module is
        # needed on the client and the 131 KB of path data stays server-rendered.
        lines.append(
            '        <path d="%s" fill="%s"\n'
            '          data-market="%s" data-group="%s" data-gdp="%.2f" />'
            % (d, fill, label, group, gdp)
        )
    paths = "\n".join(lines)

    dark = HATCH_PERIOD * HATCH_DARK

    tsx = TEMPLATE % {
        "view_w": VIEW_W,
        "view_h": VIEW_H,
        "ground": C_GROUND,
        "border": C_BORDER,
        "hatch": C_HATCH,
        "period": num(HATCH_PERIOD),
        "half": num(HATCH_PERIOD / 2.0),
        "dark": num(dark),
        "paths": paths,
        "count": len(plain) + len(marked),
    }
    with io.open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(tsx)

    print("  wrote %s" % os.path.relpath(OUT, ROOT))
    print("  %d countries, %.0f KB" % (len(plain) + len(marked), os.path.getsize(OUT) / 1024.0))


TEMPLATE = '''/* ============================================================================
   The Geographies world map (deck 14) — GENERATED FILE, DO NOT EDIT BY HAND.

   Named for its section rather than the obvious WorldMap, because
   brand/WorldMap.tsx already exists: a stylised dotted map built from rough
   land bounding boxes, dating to the first commit and imported nowhere. It
   is dead code, but it is not this, so the two are kept apart.

   Regenerate with:  python quant/make_world_svg.py

   This replaced site/public/world-reach.png — %(count)d country outlines as
   <path> rather than a flat picture.

   It carried a legend in HTML underneath ("Developed (10): Australia, ...")
   which was the original point: in the PNG that text was painted into the
   pixels and could not be selected, copied or found. Harsha had it removed on
   8 Sep 2026, so the map now shows solid and hatched fills with nothing naming
   them, and the section heading above is the only wording. The legend markup is
   in this file's history if it is ever wanted back.

   The projection and palette were fitted to the original artwork rather than
   chosen, so this lands on top of the PNG it replaces. See the generator.

   The fifteen shaded paths carry data-market/data-group/data-gdp. MapHover, the
   client wrapper, reads them off the hovered node to build its tooltip — which
   is how this file stays a server component and keeps its path data out of the
   JavaScript bundle.
   ========================================================================== */

import { MapHover } from "@/components/brand/MapHover";

export function GeographiesMap() {
  return (
    <figure className="mt-12 overflow-hidden rounded-sm border border-pearl/10 bg-sisal p-4 sm:p-8">
      <MapHover>
      {/* The zoom trigger is this wrapper, not the SVG: the SVG stays
          aria-hidden, while the wrapper is what gets the button role and the
          accessible name. Lightbox clones this node's markup, which is why the
          SVG paints its own sisal ground — cloned onto the lightbox's dark
          panel it would otherwise be dark countries on a dark background. */}
      <div
        className="mx-auto block w-full max-w-4xl cursor-zoom-in transition-opacity duration-200 hover:opacity-90"
        data-zoom
        role="button"
        tabIndex={0}
        aria-label="Enlarge map"
      >
      <svg
        viewBox="0 0 %(view_w)d %(view_h)d"
        className="block w-full"
        aria-hidden="true"
      >
        <rect width="%(view_w)d" height="%(view_h)d" fill="%(ground)s" />
        <defs>
          <pattern
            id="wm-hatch"
            width="%(period)s"
            height="%(period)s"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="%(period)s" height="%(period)s" fill="%(ground)s" />
            <rect width="%(dark)s" height="%(period)s" fill="%(hatch)s" />
          </pattern>
        </defs>

        <g stroke="%(border)s" strokeWidth="1.4" strokeLinejoin="round" fillRule="evenodd">
%(paths)s
        </g>
      </svg>
      </div>
      </MapHover>
    </figure>
  );
}
'''

if __name__ == "__main__":
    main()
