# ClimateTransit

An interactive 3D globe that shows **how the climate zone under any place on Earth
shifts over the coming decades** — and what to do about it. Click anywhere (or
search a city), slide through time and SSP scenarios, and get a sourced
resilience plan plus a Gemini-written brief.

> **Projection, not prediction.** Future views show one plausible climate under a
> chosen scenario, not a forecast of a specific year.

## What it does

- **Spinning Köppen globe** — an equirectangular Köppen–Geiger texture built in the
  browser from 0.5° class grids; auto-rotates when idle, respects
  `prefers-reduced-motion`.
- **Click → zone panel** — instant client-side grid lookup shows the zone *now vs
  the selected future period*, the adversities that zone can bring, and whether the
  place changes class.
- **Manifest-driven time slider** — real period labels and a scenario toggle
  (SSP1-2.6 / 2-4.5 / 5-8.5) come only from `manifest.json`; moving it swaps the
  globe texture and updates the headline shift counter from `shift_stats.json`.
- **Live risk chips** — Heat / Dry–Wet / UV / Air from Open-Meteo (air quality is
  CAMS model output). Thresholds are fixed and transparent (hover a chip for its
  formula); missing inputs show “limited data”, never a fabricated value.
- **Resilience plan** — curated, sourced actions by Köppen group, grouped by horizon
  (now / this season / long term) and filterable by audience (farmer / household /
  planner), each linking its source.
- **Gemini brief** — a ≤100-word brief built from a **facts-only** prompt; Gemini may
  rephrase but never invents actions, with a template fallback when it’s unavailable.
- **Planner view** — country ranking of land-share changing zone for the selected
  period/scenario, with CSV download and a method note.
- **Honesty everywhere** — SAMPLE-data badge, “projection, not prediction” labels,
  model-vs-station labels, and an “About these data” panel listing Köppen limits.

## Data sources & licenses

| Data | Source | Notes |
|------|--------|-------|
| Köppen–Geiger class grids | Project pipeline (`data-pipeline/`) | Replace the synthetic sample with **Beck et al. (2023)** GeoTIFFs for authentic zones. While the sample is active the UI shows a **SAMPLE** badge. See `data-pipeline/01_download.md` for exact URLs + licenses. |
| Shift statistics | Computed from the project’s own grids | Area-weighted (cos latitude) share of land cells changing class. |
| Live weather & UV | [Open-Meteo](https://open-meteo.com/) | Free, no key. |
| Air quality (PM2.5/PM10/dust) | Open-Meteo / **CAMS model** | Model output, not a station reading. |
| Geocoding | Open-Meteo geocoding API | City search + fly-to. |
| Resilience actions | FAO, IPCC AR6 WGII, WHO, WMO | Linked per action; language is “helps reduce risk”. |

## Honesty notes

- Köppen zones use **monthly temperature and rainfall only**; borders are sharp lines
  over gradual change, and the classification covers **land, not oceans**.
- Future periods are **projections under an SSP scenario**, not predictions.
- Air-quality and risk chips are **model-based** and clearly labelled; thresholds are
  shown on hover. The app **never fabricates** a value — it degrades to “limited data”.
- The Gemini brief is constrained to **rephrase provided facts**; it cannot add
  actions, numbers, or places.

## Run locally

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production build to dist/
npm test           # grid/manifest unit tests (Vitest)
npm run lint       # oxlint
```

The Gemini brief calls the `/api/summary` Vercel function. Locally (without the
function) it automatically uses the facts-only template fallback. To enable Gemini,
copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` (never prefix it with
`VITE_` — that would ship the key to the browser).

## Deploy (Vercel)

- **Root Directory:** `frontend`, framework **Vite**, build `npm run build`, output `dist`.
- Set `GEMINI_API_KEY` in Production + Preview environment variables.
- `vercel.json` handles the SPA rewrite and long-cache headers for `/data/*`.
