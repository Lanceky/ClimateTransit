"""
03_build_shift_stats.py — Area-weighted zone-shift statistics -> shift_stats.json.

For each projection period/scenario, computes (relative to the baseline):
  - area-weighted (cos latitude) share of land cells that change Köppen class,
  - the most common class transitions,
  - a per-country ranking of land share changing zone.

The globe header counter and the planner table read from this file.
"""

from __future__ import annotations
import json
import os
from collections import defaultdict
import numpy as np

from common import WIDTH, HEIGHT, cell_lonlat, rasterize_polygons
from koppen import CLASSES

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "..", "frontend", "public", "data")
COUNTRIES = os.path.join(HERE, "sources", "ne_110m_admin_0_countries.geojson")


def load_grid(fname):
    return np.fromfile(os.path.join(OUT, fname), dtype=np.uint8).reshape(HEIGHT, WIDTH)


def main():
    with open(os.path.join(OUT, "manifest.json")) as f:
        manifest = json.load(f)

    periods = {p["id"]: p for p in manifest["periods"]}
    baseline_id = manifest["baselineId"]
    base = load_grid(periods[baseline_id]["file"])

    _, lat = cell_lonlat()
    w = np.cos(np.deg2rad(lat)).astype(np.float64)
    land = base > 0

    # Country id grid (index into names list; 0 = none).
    with open(COUNTRIES) as f:
        cdata = json.load(f)
    names = ["(none)"]
    name_index = {}
    for feat in cdata["features"]:
        nm = feat["properties"].get("NAME") or feat["properties"].get("ADMIN")
        if nm not in name_index:
            name_index[nm] = len(names)
            names.append(nm)
    country_grid = rasterize_polygons(
        COUNTRIES,
        value_fn=lambda feat: name_index[feat["properties"].get("NAME")
                                         or feat["properties"].get("ADMIN")],
    )

    results = {}
    for pid, p in periods.items():
        if p["kind"] != "projection":
            continue
        fut = load_grid(p["file"])
        changed = (base != fut) & land
        total_w = float(w[land].sum())
        pct = 100.0 * float(w[changed].sum()) / total_w

        # Most common transitions.
        trans = defaultdict(float)
        br = base[changed]
        fr = fut[changed]
        ww = w[changed]
        for b, fv, wt in zip(br, fr, ww):
            trans[(int(b), int(fv))] += float(wt)
        top = sorted(trans.items(), key=lambda kv: -kv[1])[:8]
        top_transitions = [
            {"from": CLASSES[b - 1], "to": CLASSES[fv - 1],
             "pctOfChanged": round(100.0 * val / float(ww.sum()), 1)}
            for (b, fv), val in top
        ]

        # Per-country ranking.
        country_rank = []
        for idx in range(1, len(names)):
            cmask = (country_grid == idx) & land
            cw = float(w[cmask].sum())
            if cw <= 0:
                continue
            ch = float(w[cmask & changed].sum())
            country_rank.append({
                "country": names[idx],
                "pct": round(100.0 * ch / cw, 1),
                "landCells": int(cmask.sum()),
            })
        country_rank.sort(key=lambda d: -d["pct"])

        results[pid] = {
            "scenario": p["scenario"],
            "label": p["label"],
            "pctLandChangingZone": round(pct, 1),
            "topTransitions": top_transitions,
            "countryRanking": country_rank,
        }
        print(f"  {pid}: {pct:.1f}% land changes zone "
              f"({len(country_rank)} countries ranked)")

    out = {
        "baselineId": baseline_id,
        "baselineLabel": periods[baseline_id]["label"],
        "method": ("Area-weighted (cos latitude) share of land cells whose "
                   "Köppen class differs from the baseline period. "
                   "Computed from the project's own grids."),
        "dataSource": manifest.get("dataSource"),
        "periods": results,
    }
    with open(os.path.join(OUT, "shift_stats.json"), "w") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote shift_stats.json ({len(results)} projection periods)")


if __name__ == "__main__":
    main()
