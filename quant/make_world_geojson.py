"""make_world_geojson.py — one-off: TopoJSON -> GeoJSON for the landing map.

The Geographies section used an 807 KB PNG, so nothing on the page knew where
any country was. ECharts can draw a real map but wants GeoJSON, while the
Natural Earth distribution is TopoJSON (arcs shared between neighbours, delta
encoded, quantised). Rather than ship a topojson decoder to the browser for a
file that never changes, it is decoded once here and the result committed.

Source: world-atlas@2 countries-110m.json (Natural Earth 1:110m admin-0),
        the same dataset the old PNG was credited to.

Coordinates are rounded to 2 decimal places — about 1 km at the equator, far
finer than a 900px-wide map can show, and it roughly halves the file.

Usage:  python quant/make_world_geojson.py <input.json> <output.geojson>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

PRECISION = 2


def decode_arcs(topo: dict) -> list:
    """Undo delta encoding and quantisation, once, for every arc."""
    tf = topo.get("transform")
    out = []
    for arc in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            if tf:
                px = x * tf["scale"][0] + tf["translate"][0]
                py = y * tf["scale"][1] + tf["translate"][1]
            else:
                px, py = x, y
            pts.append([round(px, PRECISION), round(py, PRECISION)])
        out.append(pts)
    return out


def ring(arcs: list, idx_list: list) -> list:
    """Stitch arc indices into one ring. A negative index means traverse the
    arc backwards, and it is encoded as ~i, so the arc is arcs[~i] reversed."""
    pts: list = []
    for i in idx_list:
        seg = arcs[~i][::-1] if i < 0 else arcs[i]
        # the shared endpoint would otherwise be duplicated at every join
        pts.extend(seg[1:] if pts else seg)
    return pts


def to_geojson(topo: dict, layer: str = "countries") -> dict:
    arcs = decode_arcs(topo)
    feats = []
    for geom in topo["objects"][layer]["geometries"]:
        t = geom.get("type")
        if t == "Polygon":
            coords = [ring(arcs, r) for r in geom["arcs"]]
        elif t == "MultiPolygon":
            coords = [[ring(arcs, r) for r in poly] for poly in geom["arcs"]]
        else:
            continue                     # points/lines: nothing to draw here
        props = dict(geom.get("properties") or {})
        # ECharts matches a region by `name`, so it must be present
        props.setdefault("name", geom.get("id", ""))
        feats.append({"type": "Feature", "properties": props,
                      "geometry": {"type": t, "coordinates": coords}})
    return {"type": "FeatureCollection", "features": feats}


def main() -> None:
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    topo = json.loads(src.read_text(encoding="utf-8"))
    gj = to_geojson(topo)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(gj, separators=(",", ":")), encoding="utf-8")
    print("  features : %d" % len(gj["features"]))
    print("  written  : %s (%.0f KB)" % (dst, dst.stat().st_size / 1024))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main()
