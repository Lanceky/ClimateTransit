# Data pipeline — sources & how to run

> Honesty note (context.md §4): the shipped grids are produced by the **real
> Köppen–Geiger classification algorithm** (`koppen.py`) applied to a
> **transparent synthetic climatology** (`02_build_koppen_grids.py`). They are
> stamped `dataSource: "PLACEHOLDER-SYNTHETIC"` in `manifest.json` and the UI
> shows a persistent **SAMPLE** badge. Swap in the authentic maps below for the
> final submission — only the climate *input* step changes.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install numpy pillow
# For authentic Beck GeoTIFFs also: rasterio
```

## Run

```bash
.venv/bin/python 02_build_koppen_grids.py   # grids + manifest + legend
.venv/bin/python 03_build_shift_stats.py    # shift_stats.json
```

Outputs are written to `../frontend/public/data/`.

## Sources

### Land / country geometry (used now, committed in `sources/`)
- **Natural Earth 110m land** and **110m admin-0 countries** (public domain).
  - `ne_110m_land.geojson`, `ne_110m_admin_0_countries.geojson`
  - https://github.com/nvkelso/natural-earth-vector

### Köppen–Geiger maps (authentic — TO SWAP IN) — VERIFY license/periods
- **Preferred:** Beck et al. (2023), *High-resolution (1 km) Köppen-Geiger maps
  for 1901–2099 based on constrained CMIP6 projections*, Figshare collection
  `10.6084/m9.figshare.c.6395666`. Archive `koppen_geiger_tif.zip` contains
  0.5°, 0.05° and 1 km GeoTIFFs for historical windows and SSP1-2.6 / SSP2-4.5 /
  SSP5-8.5 future windows, plus `legend.txt`.
  - To integrate: extract the `0p5` GeoTIFFs, read with `rasterio`, majority-
    resample to the 720×360 grid, remap the source legend IDs to `koppen.CLASSES`
    order, and replace `synth_climate()` usage with the raster read. The manifest
    writer, legend, grids, and `03_build_shift_stats.py` stay unchanged.
- **Fallback:** Beck et al. (2018) present (1980–2016) + end-of-century
  (2071–2100, one high-emissions scenario) — a coarser two-stop slider.

### Climate normals for authentic twins / normals (later phases) — VERIFY
- **WorldClim 2.1** present climatology + **CMIP6** downscaled projections.

## VERIFY before relying on any of the above
Exact periods, scenarios, resolution, license, and download links; whether the
Beck archive download requires a browser session (Figshare `ndownloader` returns
HTTP 202 to automated clients — download via browser, then place the `0p5`
GeoTIFFs in `sources/`).
