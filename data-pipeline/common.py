"""
common.py — shared grid constants, GeoJSON rasterization, and the Köppen legend
(colors + plain names + typical hazards) for the ClimateTransit data pipeline.
"""

from __future__ import annotations
import json
import numpy as np
from PIL import Image, ImageDraw

# --- Grid definition (0.5° global, row 0 = north) ---
WIDTH = 720
HEIGHT = 360
RES = 0.5
LON0 = -180.0
LAT0 = 90.0


def cell_lonlat():
    """Return (lon[H,W], lat[H,W]) of cell centers."""
    cols = np.arange(WIDTH)
    rows = np.arange(HEIGHT)
    lon = LON0 + (cols + 0.5) * RES
    lat = LAT0 - (rows + 0.5) * RES
    lon2d = np.broadcast_to(lon, (HEIGHT, WIDTH)).copy()
    lat2d = np.broadcast_to(lat[:, None], (HEIGHT, WIDTH)).copy()
    return lon2d, lat2d


def _lonlat_to_px(lon, lat):
    x = (lon - LON0) / RES
    y = (LAT0 - lat) / RES
    return x, y


def rasterize_polygons(geojson_path: str, value_fn=None):
    """Rasterize a (Multi)Polygon FeatureCollection onto the grid.

    If value_fn is None -> boolean land mask (True inside).
    If value_fn(feature) -> int, returns an int grid filled with that value
    (0 = outside), later features overwrite earlier ones.
    """
    with open(geojson_path) as f:
        data = json.load(f)

    if value_fn is None:
        img = Image.new("L", (WIDTH, HEIGHT), 0)
        draw = ImageDraw.Draw(img)
        for feat in data["features"]:
            _draw_geom(draw, feat["geometry"], 255, 0)
        return np.array(img) > 0

    grid = np.zeros((HEIGHT, WIDTH), dtype=np.int32)
    for feat in data["features"]:
        val = value_fn(feat)
        if val is None:
            continue
        img = Image.new("L", (WIDTH, HEIGHT), 0)
        draw = ImageDraw.Draw(img)
        _draw_geom(draw, feat["geometry"], 255, 0)
        mask = np.array(img) > 0
        grid[mask] = val
    return grid


def _draw_geom(draw, geom, fill, hole_fill):
    gtype = geom["type"]
    if gtype == "Polygon":
        _draw_polygon(draw, geom["coordinates"], fill, hole_fill)
    elif gtype == "MultiPolygon":
        for poly in geom["coordinates"]:
            _draw_polygon(draw, poly, fill, hole_fill)


def _draw_polygon(draw, rings, fill, hole_fill):
    for i, ring in enumerate(rings):
        pts = [tuple(_lonlat_to_px(lon, lat)) for lon, lat in ring]
        draw.polygon(pts, fill=(fill if i == 0 else hole_fill))


def inlandness(land: np.ndarray, iterations: int = 60) -> np.ndarray:
    """Cheap 0..1 'distance from coast' proxy via iterative propagation."""
    dist = np.zeros_like(land, dtype=np.float32)
    cur = land.astype(bool)
    for _ in range(iterations):
        nb = (
            np.roll(cur, 1, 0) & np.roll(cur, -1, 0)
            & np.roll(cur, 1, 1) & np.roll(cur, -1, 1)
        )
        cur = cur & nb
        dist += cur
    if dist.max() > 0:
        dist /= dist.max()
    return dist * land


# --- Legend: id, code, plain name, hex color, main-group hazards ---
LEGEND = [
    (1, "Af", "Tropical rainforest", "#0b61ff", ["flooding", "humidity heat", "landslides"]),
    (2, "Am", "Tropical monsoon", "#1b7cff", ["monsoon flooding", "humidity heat"]),
    (3, "Aw", "Tropical savanna", "#49a0ff", ["drought", "wildfire", "heat"]),
    (4, "BWh", "Hot desert", "#ff2e2e", ["extreme heat", "water scarcity", "dust"]),
    (5, "BWk", "Cold desert", "#ff7a5a", ["water scarcity", "temperature swings", "dust"]),
    (6, "BSh", "Hot steppe", "#ffb24d", ["drought", "heat", "dust"]),
    (7, "BSk", "Cold steppe", "#ffd27a", ["drought", "cold snaps", "dust"]),
    (8, "Csa", "Hot-summer Mediterranean", "#ffe400", ["wildfire", "drought", "heatwave"]),
    (9, "Csb", "Warm-summer Mediterranean", "#f2d300", ["wildfire", "drought"]),
    (10, "Csc", "Cold-summer Mediterranean", "#dcc000", ["drought", "cold snaps"]),
    (11, "Cwa", "Humid subtropical (dry winter)", "#9bff57", ["monsoon flooding", "heat"]),
    (12, "Cwb", "Subtropical highland (dry winter)", "#6fe03a", ["drought", "frost"]),
    (13, "Cwc", "Cold subtropical highland", "#4fb52a", ["frost", "drought"]),
    (14, "Cfa", "Humid subtropical", "#45e2e6", ["flooding", "humid heat", "storms"]),
    (15, "Cfb", "Oceanic", "#2bbfd0", ["flooding", "storms", "heat (rising)"]),
    (16, "Cfc", "Subpolar oceanic", "#1f93a6", ["storms", "cold"]),
    (17, "Dsa", "Hot-summer continental (dry summer)", "#ff6fe0", ["wildfire", "drought", "heat"]),
    (18, "Dsb", "Warm-summer continental (dry summer)", "#e04fc0", ["wildfire", "drought"]),
    (19, "Dsc", "Subarctic (dry summer)", "#b53aa0", ["cold", "drought"]),
    (20, "Dsd", "Extremely cold (dry summer)", "#8a2a7a", ["extreme cold", "drought"]),
    (21, "Dwa", "Hot-summer continental (dry winter)", "#b09bff", ["heat", "flooding", "cold snaps"]),
    (22, "Dwb", "Warm-summer continental (dry winter)", "#8f6fe0", ["flooding", "cold snaps"]),
    (23, "Dwc", "Subarctic (dry winter)", "#6f4fb5", ["extreme cold", "thaw"]),
    (24, "Dwd", "Extremely cold (dry winter)", "#50348a", ["extreme cold", "permafrost thaw"]),
    (25, "Dfa", "Hot-summer continental", "#7a9bff", ["flooding", "heatwave", "cold snaps"]),
    (26, "Dfb", "Warm-summer continental", "#5a7ae0", ["flooding", "cold snaps", "heat (rising)"]),
    (27, "Dfc", "Subarctic", "#3a5ab5", ["extreme cold", "wildfire", "permafrost thaw"]),
    (28, "Dfd", "Extremely cold subarctic", "#2a3f8a", ["extreme cold", "permafrost thaw"]),
    (29, "ET", "Tundra", "#b8c6d6", ["permafrost thaw", "extreme cold"]),
    (30, "EF", "Ice cap", "#eef3fb", ["extreme cold", "ice loss"]),
]


def write_legend(path: str):
    out = [
        {"id": i, "code": code, "name": name, "color": color,
         "group": code[0], "hazards": hazards}
        for (i, code, name, color, hazards) in LEGEND
    ]
    with open(path, "w") as f:
        json.dump({"classes": out, "note": "Köppen–Geiger classes. Colors tuned "
                   "for a vibrant dark theme while keeping classes distinct."},
                  f, indent=2)
