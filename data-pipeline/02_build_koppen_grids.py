"""
02_build_koppen_grids.py — Build Köppen class grids + manifest.json.

DATA PROVENANCE (honesty contract, context.md §4):
  The Köppen *classification* here is the real Peel/McMahon algorithm (koppen.py).
  The climate *inputs* are a transparent, documented SYNTHETIC model (a smooth
  latitude + continentality climatology with per-SSP warming/precip deltas),
  NOT observed data. The manifest is therefore stamped dataSource="PLACEHOLDER-
  SYNTHETIC" so the UI shows a persistent SAMPLE badge. To ship real zones,
  drop Beck et al. (2023) GeoTIFFs into sources/ and replace `synth_climate`
  with a rasterio read (see 01_download.md); nothing else changes.

Outputs -> ../frontend/public/data/
  koppen_<scenario>_<period>.bin   (Uint8, 720x360, row 0 = north)
  manifest.json
  koppen_legend.json
"""

from __future__ import annotations
import gzip  # noqa: F401  (kept for optional compression; raw .bin used for browser simplicity)
import json
import os
import numpy as np

from common import (WIDTH, HEIGHT, RES, cell_lonlat, rasterize_polygons,
                    inlandness, write_legend)
from koppen import classify_grids

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "..", "frontend", "public", "data")
LAND_GEOJSON = os.path.join(HERE, "sources", "ne_110m_land.geojson")

# Global-mean warming (°C above the 1991–2020 baseline) per scenario & window.
SCENARIOS = {
    "ssp126": {"2041_2070": 1.1, "2071_2099": 1.4},
    "ssp245": {"2041_2070": 1.7, "2071_2099": 2.6},
    "ssp585": {"2041_2070": 2.4, "2071_2099": 4.3},
}
PERIOD_LABELS = {"2041_2070": "2041–2070", "2071_2099": "2071–2099"}


def synth_climate(lon, lat, land, inl, warming=0.0):
    """Return (temp[12,H,W], precip[12,H,W]) for the given warming delta.

    Transparent analytic climatology. Documented, not observed.
    """
    absL = np.abs(lat)
    # --- Annual mean temperature (sea-level-ish) ---
    tbase = 29.0 - 51.0 * (absL / 90.0) ** 1.45
    # Strong additional cooling toward the poles -> genuine tundra / ice caps.
    polar_cool = 20.0 * np.clip((absL - 58.0) / 32.0, 0.0, 1.0) ** 1.2
    # Seasonal amplitude grows with latitude and continentality (inlandness),
    # but is damped at the extreme poles so summers stay below freezing (EF).
    amp = (3.0 + 30.0 * (absL / 90.0)) * (0.5 + 0.9 * inl)
    amp = amp * np.clip(1.0 - 0.5 * (absL - 72.0) / 18.0, 0.45, 1.0)
    # Interiors run slightly cooler in the mean at high latitude.
    tmean = tbase - polar_cool - 2.5 * inl * (absL / 90.0)

    # Polar-amplified warming applied to the mean.
    dT = warming * (1.0 + 0.9 * (absL / 90.0))
    tmean = tmean + dT

    months = np.arange(12)
    temp = np.empty((12, HEIGHT, WIDTH), dtype=np.float32)
    for m in months:
        # NH warmest in July (m=6), SH warmest in January (m=0).
        peak = np.where(lat >= 0, 6.0, 0.0)
        temp[m] = tmean + amp * np.cos(2 * np.pi * (m - peak) / 12.0)

    # --- Annual precipitation by latitude band, dried by continentality ---
    annual = np.full_like(tbase, 400.0)
    annual = np.where(absL < 10, 2300.0, annual)
    annual = np.where((absL >= 10) & (absL < 20), 1300.0, annual)
    annual = np.where((absL >= 20) & (absL < 33), 320.0, annual)
    annual = np.where((absL >= 33) & (absL < 45), 750.0, annual)
    annual = np.where((absL >= 45) & (absL < 60), 850.0, annual)
    annual = np.where((absL >= 60) & (absL < 72), 450.0, annual)
    annual = np.where(absL >= 72, 180.0, annual)
    # Interiors are drier (deserts / continental steppe).
    annual = annual * (1.0 - 0.6 * inl)
    annual = np.maximum(annual, 20.0)

    # Precip change with warming: wet tropics/high-lat wetter, subtropics drier.
    ptrend = np.where(absL < 15, 1.0 + 0.03 * warming,
              np.where(absL < 35, 1.0 - 0.045 * warming, 1.0 + 0.02 * warming))
    annual = annual * np.clip(ptrend, 0.5, 1.6)

    # --- Seasonal distribution ---
    # Mediterranean (dry-summer) belt: 30–45°, near coast.
    med = (absL >= 30) & (absL < 45) & (inl < 0.33)
    # Summer-peaked (monsoon/convective) elsewhere; weaker near equator & poles.
    conc = np.where(absL < 20, 0.55, np.where(absL < 45, 0.45, 0.30)).astype(np.float32)
    conc = np.where(absL < 6, 0.20, conc)  # near-equator: more even

    precip = np.empty((12, HEIGHT, WIDTH), dtype=np.float32)
    for m in months:
        # summer-peak month: NH July(6)/SH Jan(0); winter-peak flips by 6 months.
        summer_peak = np.where(lat >= 0, 6.0, 0.0)
        winter_peak = np.where(lat >= 0, 0.0, 6.0)
        peakP = np.where(med, winter_peak, summer_peak)
        kconc = np.where(med, 0.75, conc)
        w = 1.0 + kconc * np.cos(2 * np.pi * (m - peakP) / 12.0)
        precip[m] = w
    precip = precip / precip.sum(axis=0, keepdims=True)  # normalize weights
    precip = precip * annual[None, :, :]
    precip = precip.astype(np.float32)

    return temp, precip


def write_grid(path, grid_u8):
    grid_u8.astype(np.uint8).tofile(path)


def main():
    os.makedirs(OUT, exist_ok=True)
    print("Rasterizing land mask…")
    land = rasterize_polygons(LAND_GEOJSON)
    lon, lat = cell_lonlat()
    inl = inlandness(land)
    print(f"  land cells: {int(land.sum())} / {land.size}")

    entries = []

    def build(scenario, period_key, label, start, end, kind, warming):
        temp, precip = synth_climate(lon, lat, land, inl, warming)
        grid = classify_grids(temp, precip, land, lat)
        fname = f"koppen_{scenario}_{period_key}.bin"
        write_grid(os.path.join(OUT, fname), grid)
        entries.append({
            "id": f"{scenario}_{period_key}",
            "scenario": scenario,
            "label": label,
            "startYear": start,
            "endYear": end,
            "file": fname,
            "kind": kind,
        })
        nz = int((grid > 0).sum())
        print(f"  built {fname}  (classified land cells: {nz})")

    print("Building baseline (historical 1991–2020)…")
    build("historical", "1991_2020", "1991–2020", 1991, 2020, "historical", 0.0)

    print("Building projections…")
    for scenario, windows in SCENARIOS.items():
        for pkey, warming in windows.items():
            s, e = pkey.split("_")
            build(scenario, pkey, PERIOD_LABELS[pkey], int(s), int(e),
                  "projection", warming)

    manifest = {
        "dataSource": "PLACEHOLDER-SYNTHETIC",
        "note": ("Köppen classes computed with the real Peel/McMahon algorithm "
                 "from a transparent synthetic climatology. Replace sources with "
                 "Beck et al. (2023) GeoTIFFs for authentic zones. UI must show a "
                 "SAMPLE badge while this source is active."),
        "grid": {"width": WIDTH, "height": HEIGHT, "res": RES,
                 "bounds": [-180, -90, 180, 90], "rowOrder": "north-to-south",
                 "oceanId": 0, "dtype": "uint8"},
        "scenarios": ["historical"] + list(SCENARIOS.keys()),
        "baselineId": "historical_1991_2020",
        "periods": entries,
    }
    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    write_legend(os.path.join(OUT, "koppen_legend.json"))
    print(f"Wrote manifest.json ({len(entries)} periods) and koppen_legend.json")


if __name__ == "__main__":
    main()
