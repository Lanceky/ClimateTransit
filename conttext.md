# ClimateTransit — context.md

> Spec for an AI coding agent. Read the whole file before writing code. Sections 3 and 4 are non-negotiable.

## 1. One-liner

**ClimateTransit** is an interactive 3D globe built for **climate resilience**. It shows how a place's climate is shifting, which adversities that shift brings (heat, drought, flooding, smoke and others), and what people can do to prevent or reduce harm — backed by verified, plain-language local weather and risk guidance. The organizing idea is the **Köppen–Geiger climate zone**, the standard scientific classification of the world's land climates by temperature and rainfall patterns, so every place gets a zone, the hazards typical of that zone, and actions that fit it. It also mentions places that already live in a similar future climate, as supporting evidence of what works there.

Pitch line: *"Climate is in transit. We show what's coming to your place and what you can do about it before it hits."*

**Aim:** resilience and prevention. Insight is only useful if it ends in action, so every screen should answer three questions: *What is changing here? What adversity does it bring? What can we do to prevent or reduce it?* The similar-future-climate feature is a small supporting reference, never the headline.

**Organizing concept: Köppen zones.** Zone → typical hazards → fitting actions → how the zone is shifting over time. The globe colors, time slider, shift counter, resilience plans, forecast reliability, and planner view are all keyed to zones.

## 2. Hackathon context (CodeRED: Orion)

- Required submission: **hosted website + public repository**. Hosting target: **Vercel** (see section 5.1).
- Cash tracks to target: **Best Environment Hack ($500)** primary, **Best Pitch/Demo ($500)** secondary, **Best Overall ($1,000)** long shot.
- Sponsor integration worth doing for real: **Gemini API** (plain-language summaries and playbooks). Optional only if genuinely used: Tiger Data (time-series storage). Do not bolt on integrations just to collect entries.
- Judging favors: real-world impact, completeness and stability, a clear target user, and a memorable demo. A smaller project that works live beats a larger one that breaks.
- Target users for the pitch: planners/NGOs, farmers and communities, educators/the public. Pitch angle: resilience — preventing and reducing climate adversity, not just showing it.

## 3. Non-negotiables (user requirements)

**Aim (governs every other requirement):** build resilience. Prefer constructive insight and prevention over alarm; every view ends in actions. The similar-future-climate place is mentioned as a supporting reference only and must not drive the layout, copy, or demo.

1. **Intuitive, vibrant UI.** First-time user understands it in under 10 seconds with no instructions.
2. **3D responsive globe that spins.** Auto-rotates when idle; drag to rotate, scroll/pinch to zoom; works on desktop and phone.
3. **Click any point → data for that place.** Panel leads with what is changing and what to do (resilience plan), then weather, risks, and sources. Places with a similar future climate appear only as a small supporting reference.
4. **Time slider that is accurate or close to accurate.** It may only offer time periods the underlying dataset really contains. See section 4.
5. **Includes the fused concepts, organized around resilience:** Köppen zone shift (what is changing), zone-aware resilience plans (how to prevent or reduce adversity — the core), risk chips with actions, forecast correction with reliability per zone, Gemini resilience brief, planner view. Supporting: similar-future-climate reference (small), sister places (stretch), simulated sensor trust demo (stretch).

## 4. Accuracy and honesty contract

The agent must enforce these in code and in UI copy:

- **Slider stops come from `manifest.json`, never hardcoded.** The slider snaps to real dataset periods (for example 30-year windows). No invented years. Crossfade between stops is allowed as a visual only and the label must keep showing the nearest real period.
- **Every future view shows its scenario** (SSP badge) and the words "projection, not prediction".
- **Label anything simulated** with a persistent "SIMULATED" badge (sensor network, any synthetic data).
- **Köppen limits stated in UI:** based on monthly temperature and rainfall averages; ignores soils, terrain detail, wind, extremes; borders are sharp lines on gradual change; land only.
- **"Twin" means similar on the listed climate measures**, not identical in soils, culture, or geography. Show a coarse match strength (Strong / Moderate / Loose), not a fake-precise percentage.
- **Satellite vs model data must be labeled correctly.** Air-quality numbers from a forecast model (for example CAMS via Open-Meteo) are "model-based", not satellite. Satellite air products measure the whole atmospheric column, not ground level.
- **No health or cancer causation claims.** Risk chips describe environmental conditions only.
- **Resilience language:** say "helps reduce risk" or "helps prevent", never guarantee an outcome. Every action needs a source, and the UI states that actions should be confirmed with local experts.
- **The similar-future-climate place is never the headline.** It sits below the resilience plan, collapsed by default, with no hero treatment in layout, copy, or demo.
- **Wow facts are computed from our own data where possible** (area-weighted % of land changing zone). Any recalled figure from papers goes in the "VERIFY" list (section 16) and must not appear in the UI until checked against the source.
- **Forecast improvement claims** only from a chronological hold-out test, reported per zone and lead time, including where there is no improvement.
- If an external API fails, degrade gracefully with a clear message. Never show fabricated values as a fallback.

## 5. Tech stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS. Icons: lucide-react.
- **Globe:** `react-globe.gl` (three-globe on Three.js). Uses: custom `globeImageUrl` (canvas-generated equirectangular texture of Köppen classes), `onGlobeClick` for `{lat, lng}`, `ringsData` for click pulse, `arcsData` for the twin arc, `pointsData` for pins, `controls().autoRotate`.
- **State:** Zustand (selected point, period, scenario, active layer, panel state).
- **Charts:** lightweight (uPlot or Recharts) for forecast and error charts.
- **Server side (minimal):** one Vercel Function, `frontend/api/summary.ts` (TypeScript), that proxies Gemini and keeps the key server-side. Nothing else needs a server because all other data are static files and live weather is fetched from the browser. Python is used only for the offline data pipeline.
- **Offline data pipeline:** Python (numpy, rasterio, pandas, scikit-learn, scipy KD-tree, geopandas).
- **Hosting:** everything runs on **Vercel**: the Vite static build and the Vercel Function live in one project on one origin (no CORS setup). Details in section 5.1. Keep total static data under roughly 50 MB.
- **Secrets:** `.env` locally only, `.env.example` committed, nothing secret in the repo (the repo is public). Production secrets live in Vercel Environment Variables. The Gemini key must never use a `VITE_` prefix, because that would ship it to the browser.

## 5.1 Hosting on Vercel (required)

- **Project setup:** import the GitHub repo into Vercel; set **Root Directory = `frontend`**; framework preset **Vite**; build command `npm run build`; output directory `dist`. Production deploys from `main`; every push or PR gets a preview URL. Create the project on day one so deployment problems show up early.
- **Same-origin architecture:** the site is served from Vercel's CDN and `/api/summary` is a Vercel Function in the same project. The browser calls `/api/summary` with a relative URL, so there is no CORS configuration and no API base URL variable.
- **Environment variables (Vercel dashboard):** `GEMINI_API_KEY` for Production and Preview; `VITE_DEFAULT_SCENARIO` if used. Locally use `vercel dev` (or `vite` plus a local proxy) with a `.env.local` that is gitignored.
- **`frontend/vercel.json` (sketch, adapt after checking current Vercel docs):**

```json
{
  "headers": [
    { "source": "/data/manifest.json",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] },
    { "source": "/data/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ],
  "rewrites": [
    { "source": "/((?!api/|data/).*)", "destination": "/index.html" }
  ]
}
```

- **Data files:** put `koppen_*`, `twins_*`, and the JSON files under `frontend/public/data/` so Vercel serves them as static assets. Use content-hashed filenames for grids so long caching is safe, and keep `manifest.json` on a short cache so new data is picked up. Pre-compress binary grids (or encode as PNG) and decode in the browser, unless compression of `.bin` responses is confirmed. Check total size and per-file limits before the final deploy.
- **The function (`api/summary.ts`):** validates the request body (size and field limits), builds the facts-only prompt from `server/prompts.ts`, calls Gemini with a hard output cap, returns `{ text, model, cached }`, and falls back to the template sentence if Gemini errors or times out. Set the function's max duration explicitly. Follow the current Vercel Functions docs for the handler signature and runtime, and the official Google Gen AI SDK docs for the package and model name.
- **Pre-demo checks:** open the production URL on a phone; confirm `/data/*` loads and is cached; confirm `/api/summary` works in Production and in a Preview deployment; confirm no secret appears in the built JS (search the `dist` output for the key prefix).
- **Fallback if the function misbehaves in the demo:** the app still works, because the resilience plan and all zone data are static; only the Gemini brief degrades to the template text.
- **VERIFY before relying on it:** current Vercel plan limits and terms for the tier you use (function timeout and bundle size, bandwidth, static file size, free-tier usage terms).

## 6. Architecture and repo structure

```
climatetransit/
  context.md
  README.md                  # setup, data sources, honesty notes, screenshots
  .env.example
  data-pipeline/
    01_download.md           # exact source URLs and licenses (fill after verifying)
    02_build_koppen_grids.py # GeoTIFF -> downsampled class grids + manifest.json
    03_build_shift_stats.py  # area-weighted change stats, per-country table
    04_build_twins.py        # feature grids -> KD-tree -> twin lookup files
    05_forecast_eval.py      # user dataset -> correction model -> metrics JSON
    06_sim_sensors.py        # simulated device network + trust scoring (stretch)
  frontend/                  # Vercel project Root Directory
    vercel.json              # cache headers, SPA rewrite, function settings
    api/
      summary.ts             # Vercel Function: Gemini proxy (facts-only prompt)
    server/
      prompts.ts             # Gemini prompt templates (not routed as a function)
    public/data/
      manifest.json
      koppen_{scenario}_{period}.bin     # Uint8 class grid per period
      twins_{scenario}_{period}.bin
      shift_stats.json
      reliability.json
      resilience_plans.json              # sourced prevention/adaptation actions
      sisters.json
      koppen_legend.json                 # code, name, color, description, hazards
    src/
      components/ Globe, TimeSlider, PointPanel, TwinCard, RiskChips,
                  ForecastChart, ReliabilityCard, PlannerView, LayerSwitcher,
                  SearchBox, ScenarioToggle, SimulatedBadge
      lib/ grid.ts (lat/lng <-> cell), koppen.ts, openmeteo.ts, textures.ts
      state/ store.ts
```

Data flow: static grids load in the browser → click converts `{lat,lng}` to a grid cell → zone and twin are instant lookups with no server round trip → live weather comes from Open-Meteo → one Vercel Function for Gemini text only (reliability numbers are a static JSON file).

## 7. Data sources and pipeline

Mark everything here as **VERIFY** (access, license, format, periods) before depending on it.

### 7.1 Köppen–Geiger maps (core of the slider)
- **Preferred:** Beck et al. (2023), Scientific Data, 1 km Köppen–Geiger maps for 1901–2099 from constrained CMIP6 projections. Expected: several historical 30-year periods plus future windows under multiple SSP scenarios (SSP1-2.6, SSP2-4.5, SSP5-8.5). **VERIFY the exact periods and scenarios available.**
- **Fallback:** Beck et al. (2018): present-day (1980–2016) and end-of-century (2071–2100, one high-emissions scenario). With the fallback the slider has only two stops — still accurate, just coarser. The UI must adapt to whatever `manifest.json` lists.
- **Processing:** resample to a global lat/lng grid with **majority (mode) resampling**, not bilinear. Default **0.5°** (720×360) for the MVP, **0.1°** as a stretch. Store as `Uint8Array` of class IDs (0 = ocean/no data, 1–30 = classes). Gzip.
- **Class codes (30):** Af, Am, Aw, BWh, BWk, BSh, BSk, Csa, Csb, Csc, Cwa, Cwb, Cwc, Cfa, Cfb, Cfc, Dsa, Dsb, Dsc, Dsd, Dwa, Dwb, Dwc, Dwd, Dfa, Dfb, Dfc, Dfd, ET, EF. Use the source dataset's legend for IDs and official colors; then adjust saturation for the vibrant theme while keeping classes visually distinct.
- **`manifest.json`:** list of `{id, scenario, label, startYear, endYear, file, kind: "historical"|"projection"}`, plus grid resolution and bounds. The slider, scenario toggle, and legends are built from this file.

### 7.2 Shift statistics (computed, not recalled)
- Baseline = most recent historical period in the manifest.
- For each projection period and scenario: **area-weighted** share of land cells whose class changed (weight each cell by `cos(latitude)`), plus the most common transitions and a per-country ranking (point-in-polygon with Natural Earth countries).
- Output `shift_stats.json`. The globe header counter reads from it ("X% of land changes zone by [period] under [scenario]").

### 7.3 Similar-future-climate features (supporting reference)

Role: finds places whose *present* climate matches a location's *future* climate, so the app can say where proven practices already exist. This is evidence for the resilience plan, never the headline.

- **Present:** WorldClim 2.1 monthly climatology. **Future:** WorldClim CMIP6 downscaled projections (ensemble mean over several GCMs) for the windows and SSPs available. **VERIFY availability and periods.** The twin card only offers windows that have feature data; the slider label states the nearest available window when the Köppen stop differs.
- **Feature vector (standardized):** annual mean temperature, temperature annual range (seasonality), annual precipitation (log), precipitation seasonality, precipitation of the driest quarter (log), mean temperature of the warmest and coldest quarters.
- **Method (offline, 1° grid):** for each land cell and each (scenario, window), build its future feature vector → find the nearest **present-day** cell in feature space (KD-tree). Rules: exclude candidates within 500 km so the twin is a different place to learn from; prefer candidates whose present Köppen class equals the target's future class when enough exist. Store twin cell index and a distance-based match strength bucket.
- **Two-hemisphere tie-in:** flag twins in the opposite hemisphere ("opposite seasons") and give a note that timing of seasons is flipped. Annual features are hemisphere-agnostic; Köppen summer/winter definitions are hemisphere-aware in the source data.
- Report GCM spread as a caveat; do not present the twin as certain.

### 7.4 Live weather and risk inputs (client-side, free, no key)
- **Open-Meteo forecast API:** current conditions, 7-day forecast, UV index. **VERIFY endpoints and fields.**
- **Open-Meteo air quality API:** PM2.5/PM10, dust, aerosol-related fields — **model-based (CAMS), label as such.**
- **Open-Meteo historical/climate normals** (or ERA5 via Open-Meteo) for a 30-year "normal for this date" baseline used by the anomaly and risk chips.
- **Geocoding** for the search box (Open-Meteo geocoding or similar; cache results).

### 7.5 Forecast correction (the "Ground Truth" module)
Depends on the **user's own northern + southern hemisphere dataset** (see open items). Expected canonical format:

```
station_id, lat, lng, valid_date, lead_days, variable, forecast_value, observed_value
```

- Assign each station a Köppen class (present-day grid lookup).
- **Split chronologically:** first ~70% train, next ~15% validation, final ~15% test. No shuffling.
- **Baselines:** raw forecast, persistence ("same as yesterday"), climatology.
- **Model:** start with per-zone, per-lead bias correction (seasonal offset); then gradient-boosted trees (e.g. scikit-learn `HistGradientBoostingRegressor`) with features: raw forecast, day-of-year sin/cos, latitude, zone, lead, and the most recent known forecast error (only information available at issue time).
- **Outputs (`reliability.json`):** per zone × variable × lead: MAE raw vs corrected, % change, sample size. Flag cells with too few samples as "insufficient data". Report where there is **no** improvement (rainfall will usually improve least).
- Roughly 1,000 days is under three years: say so. It supports seasonal bias learning, not climate trends and not rare events (droughts, floods).

### 7.6 Satellite layer (stretch)
- Public satellite tile layer (for example NASA GIBS) for one contaminant or smoke/aerosol product. **VERIFY layer availability and terms.**
- UI note: column measurement, cloud gaps, coarse resolution; not ground-level concentration.

## 8. Features and acceptance criteria

### F1. Spinning 3D globe
- Auto-rotates slowly when idle (about 0.3–0.5 °/frame-equivalent, configurable). Pauses on pointer down; resumes after ~4 s of inactivity; stops while a point is selected; respects `prefers-reduced-motion` (no auto-rotate).
- Drag to rotate, wheel/pinch to zoom with min/max distance limits. Atmosphere glow, starfield background.
- Resizes with the window; pixel ratio capped at 2; texture 2048×1024 default.
- **Accept:** smooth on a mid-range laptop; usable one-handed on a phone.

### F2. Click for place data
- `onGlobeClick({lat, lng})` → drops a pin, pulses a ring, flies the camera toward the point, opens the panel.
- Panel contents (top to bottom): place name and coordinates; **climate zone now vs selected period** (plain name, code, and a one-tap "what is this zone?" explainer with its typical hazards) with a change arrow if different; hemisphere and current season; **what's changing and what adversity it can bring**; **Resilience Plan** (actions by horizon and audience); live weather and 7-day forecast with **risk chips and their actions**; **forecast reliability for this zone**; **Gemini resilience brief**; a small, collapsed **similar-future-climate reference**; sources and caveats.
- Ocean click: friendly message ("Köppen zones cover land"), still offer weather where available.
- **Accept:** zone lookup is instant; every panel section has a loading and error state; works by tapping on mobile.

### F3. Accurate time slider
- Built from `manifest.json`; ticks labeled with real periods (for example "1991–2020", "2041–2070"); scenario toggle (SSP1-2.6 / SSP2-4.5 / SSP5-8.5) shown only for projection stops.
- Changing the stop swaps the texture (crossfade) and updates the shift counter and the panel's "zone at selected period".
- Keyboard accessible (arrow keys), with a visible "historical" vs "projection" distinction.
- **Accept:** all labels match the manifest; no period appears that has no data; changing the slider never changes unrelated state.

### F4. Zone shift counter
- Headline stat from `shift_stats.json`: "X% of Earth's land changes climate zone by [period] under [scenario]". Optional "changed cells" highlight layer.
- **Accept:** number matches an independent recomputation in a unit test; method described in an info tooltip (area-weighted).

### F5. Similar-future-climate reference (supporting only; "Kepler Twin" was the working name)
- A small, collapsed card under the resilience plan: "By [window], [place] has a climate similar to what [place, country] has today", with match strength and an optional "opposite seasons" badge. Optional "Show on globe" button draws an animated arc.
- Purpose: evidence of where adaptation practices are already used, linked from plan items via `whereItWorks`. Never the headline, never above the resilience plan, never the focus of copy or demo.
- **Accept:** appears only for windows with feature data; honest notes (similar on listed measures only); twin place named via reverse lookup of its cell.

### F6. Resilience Plan (core feature)
- The main output of the app. For the selected place and period, it shows: **what is changing** (zone now vs future, hazards likely to rise), **what adversity that can bring**, and **what to do**: prevention and adaptation actions grouped by horizon (**now**, **this season**, **long term**) and by audience (**farmer**, **household**, **community/planner**), plus **early-warning signs to watch**.
- `resilience_plans.json`: curated by hand per Köppen main group and for notable transitions (for example toward hotter or drier classes). Each item: `{id, zoneOrTransition, hazard, title, why, action, audience, horizon, earlyWarning, evidenceNote, sourceUrl, whereItWorks?}`. Use credible sources (FAO, IPCC, national agencies, peer-reviewed reviews). **VERIFY every entry before shipping.**
- `whereItWorks` is an optional note naming a place with a similar climate that already uses the practice; this is where the similar-future-climate data supports the plan.
- Language rule: "helps reduce risk" or "helps prevent", never promised outcomes; add a line that actions should be confirmed with local experts.
- Gemini may rephrase but must not add actions that are not in the JSON.
- **Accept:** every action has a source link, horizon, and audience; the audience selector re-filters the plan; the plan renders for every zone class (a generic fallback for classes without curated entries, clearly labeled as generic).

### F7. Where it already works (stretch)
- Gallery of curated or computed pairs of places that will share a climate, each with a one-click "fly there" and the practices used there. About 6–10 entries; examples must be verified before display. Lower priority than the resilience plan.

### F8. Planner view
- Toggle that switches the panel to: zone-shift hotspot layer on the globe; ranked table of countries by share of land changing zone for the selected period and scenario; downloadable CSV.
- **Accept:** table comes from `shift_stats.json`; includes the method note.

### F9. Forecast reliability and correction (Ground Truth module)
- In the point panel: "Forecast reliability in your zone": raw vs corrected error for temperature and rainfall, by lead time, with sample size and caveats; a global layer coloring zones by reliability (stretch).
- If the user dataset is not ready by the end of Phase 2, **cut this module and the UI slot** rather than showing placeholder numbers.

### F10. Risk chips and alerts
- Prototype indices, formulas visible in an info tooltip:
  - **Heat:** forecast max temperature vs the 30-year normal for the date.
  - **Dry/Wet:** 7-day forecast precipitation vs normal.
  - **UV:** forecast UV index.
  - **Air:** model-based PM2.5/dust (labeled model-based).
- Chip colors: low / elevated / high with thresholds in config. Show uncertainty or "limited data" when inputs are missing.
- Each chip links to its matching action(s) from `resilience_plans.json` ("what to do").
- **Gemini resilience brief:** `POST /api/summary` with a facts-only payload (zone, change, selected plan items, chips, forecast, optional twin). Output: what is changing, what to watch, and 2–3 actions; 100 words max; the similar-future-climate place at most one short clause. Prompt rules: use only provided facts and plan items, no medical claims, no guaranteed outcomes, plain language, optional language parameter. Cache by payload hash. If Gemini fails, show a template built from the same facts.

### F11. Simulated sensor trust demo (stretch)
- Separate route. A software-simulated network of ~1,000 devices around real reference points, with injected noise, bias, stuck values, and spoofed readings. A trust score from neighbor consensus and reference deviation down-weights bad devices. Show before/after error and how many bad devices were caught.
- Persistent **SIMULATED** badge. Optionally embed a Wokwi ESP32 node as an illustration of a field node.

### F12. Planet heartbeat widget (stretch)
- Small two-line chart of northern vs southern hemisphere mean temperature through the year (from the user's dataset), showing opposite seasons. Include only if the dataset is clean.

## 9. UI / UX spec

- **Theme:** dark space background (deep navy/indigo, about `#070B1A`), vibrant accents (electric teal, magenta, amber), glassmorphism panels, soft glows, smooth easing. Zone colors saturated and distinct; legend collapses to a chip row on mobile.
- **Typography:** Inter or Space Grotesk; large, readable numbers for key stats.
- **Layout:** desktop: globe fills the viewport, glass side panel (right) for point data, slider docked at the bottom, layer switcher top-left, search top-center. Mobile (<1024px): globe on top, **bottom sheet** panel with snap points, slider above the sheet, no horizontal scroll, touch targets at least 44px.
- **First-run hint:** "Drag to spin · Tap anywhere to explore · Slide to travel in time", dismisses on first interaction.
- **Search box:** geocoding + fly-to (also the keyboard/accessibility fallback for clicking the globe).
- **Motion:** camera fly-tos about 1–1.5 s, panel slide-in, ring pulse on click, arc draw animation for twins. Keep the globe at a stable frame rate; throttle expensive redraws.
- **Accessibility:** ARIA labels on controls, keyboard-operable slider, sufficient contrast on panels, optional color-blind-friendly palette toggle (stretch), text equivalents for zone info.
- **Always visible:** scenario/period badge; SIMULATED badge when relevant; "About these data" link (sources and limits).
- **Resilience-first copy:** lead with what can be done; use calm, action-oriented, hopeful language (no doom framing); give each hazard a matching action; keep the similar-future-climate reference visually secondary.
- **Zone literacy:** show each zone by plain name with the code beside it (for example "Hot desert (BWh)"). A short "What is a climate zone?" explainer opens from the legend and from the zone card: zones are defined from monthly temperature and rainfall, there are five main groups (A tropical, B arid, C temperate, D continental, E polar) split into about 30 types, and the limits listed in section 4.

## 10. API contracts (Vercel Function)

Only one server-side endpoint exists. Reliability numbers are a static file served from the same origin, so there is no CORS setup.

```
POST /api/summary            (Vercel Function: frontend/api/summary.ts)
     body: { zone_now, zone_future, period, scenario, place, plan_items:[{title,action,horizon}], audience?, twin?, risks:[{type,level,detail}],
             forecast_brief, language? }
     -> { text, model, cached }

GET  /data/reliability.json  (static file)
     -> { zones: { "Cfb": { temp: [{lead_days, mae_raw, mae_corrected, pct_change, n}], rain: [ ... ] } }, note }
```

The Gemini key is read from the `GEMINI_API_KEY` environment variable inside the function only. Validate the request body (size and field limits), cache by payload hash (HTTP cache headers plus best-effort in-memory), and apply simple best-effort rate limiting. Serverless instances do not share memory, so do not rely on rate limiting for abuse protection; keep a hard cap on output tokens. Set the function's max duration explicitly and return the template fallback if Gemini does not answer in time.

## 11. Build phases (adjust hour budget to the event length)

1. **Phase 0 — Data prep (parallelizable, first):** create the Vercel project and connect the GitHub repo (every push gets a preview URL); download and verify Köppen maps; build grids and `manifest.json`; build shift stats; start twin features and the user dataset check.
2. **Phase 1 — Globe core (never cut):** globe, texture generation from grids, auto-rotate, click → lat/lng → zone lookup, panel shell, slider driven by manifest, shift counter.
3. **Phase 2 — Place data:** Open-Meteo forecast and normals, risk chips, search box, reverse place naming, responsive layout and bottom sheet.
4. **Phase 3 — Resilience features:** resilience plan engine (plans JSON, audience selector, chip actions), Gemini resilience brief, planner view; then the small similar-future-climate card with arc; sister places last.
5. **Phase 4 — Ground Truth:** forecast evaluation and reliability card (only if the dataset is ready).
6. **Phase 5 — Polish and ship:** copy and honesty labels, error states, performance, README with screenshots, deploy, test on a phone, rehearse the demo.
7. **Stretch (only if ahead):** satellite layer, simulated sensor trust demo, planet heartbeat, color-blind palette, 0.1° grids.

**Cut order if time runs short:** sensor trust demo → planet heartbeat → satellite layer → sister gallery → planner CSV → reliability layer. Never cut: globe, click panel, accurate slider, shift counter, resilience plan, Gemini resilience brief.

## 12. Testing and accuracy checks

- **Grid math:** unit tests for lat/lng ↔ cell index including longitude wrap (±180°) and pole clamping.
- **Spot checks** against the source maps (verify each expected class before trusting it): Cairo (hot desert, BWh), Singapore (Af), London (Cfb), Moscow (Dfb), interior Antarctica (EF), central Sahara (BWh).
- **Manifest integrity:** every slider stop has a file; no UI period without data.
- **Shift stat test:** independent recomputation of the area-weighted changed share for one period; total area weights sanity check.
- **Resilience plans:** every item has a source link, horizon, and audience; nothing renders without sourcing; generic fallback is labeled.
- **Twin sanity:** a few twins checked by eye (twin's present class equals the target's future class where the rule applies; distance ≥ 500 km).
- **Forecast evaluation:** confirm no train/test leakage (all features available at issue time); report n per cell.
- **Resilience:** simulate Open-Meteo and Gemini failures; confirm graceful messages and no fabricated fallback values.
- **Device checks:** phone browser test for touch rotate, tap select, bottom sheet; low-end performance check.

## 13. Deployment and submission checklist

- [ ] Deployed on Vercel (Root Directory = `frontend`), production URL loads on desktop and phone
- [ ] `GEMINI_API_KEY` set in Vercel Environment Variables (Production and Preview); `/api/summary` tested on the production URL; `/data/*` caching checked
- [ ] Public repo with README (what it does, data sources and licenses, honesty notes, how to run, screenshots)
- [ ] No secrets in the repo history; `.env.example` provided
- [ ] Data files committed or reproducible via `data-pipeline/`
- [ ] Devpost submission with the live link, repo link, tracks chosen (Environment, Pitch/Demo, Overall, Gemini)
- [ ] Short demo video as backup in case the live demo fails
- [ ] After the event: DEV Writing Challenge post ($100)

## 14. Demo script (about 3 minutes)

1. **Hook (15 s):** the globe spins. "Your climate is in transit."
2. **Click your home town (30 s):** the zone appears with a one-line explanation ("Köppen zones sort the world's climates by temperature and rainfall"), then weather and risk chips.
3. **Drag the slider forward (30 s):** zone borders march; counter reads the computed share of land that changes zone; scenario badge visible.
4. **Resilience plan (45 s):** pick an audience (farmer / household / planner) → what is changing here, the hazards rising, and the actions that help prevent or reduce harm now, this season, and long term, each with a source. One optional line: "places like [X] already live this climate and use these practices" (small card, optional arc).
5. **Why you can trust it (30 s):** forecast reliability per zone from the hold-out test, including where it does *not* help; satellite/model labels.
6. **Planner view (20 s):** country ranking of zone change; mention insurance triggers and NGO planning as downstream uses.
7. **Close (15 s):** limits stated honestly; roadmap: real sensor mesh, offline alerts, local languages.

## 15. Out of scope (state in README as roadmap)

Real federated learning, offline mesh networking, native phone barometer data, per-person health advice, causal claims about disease, street-level precision, guarantees that an action will prevent a specific outcome.

## 16. VERIFY list (do not put in the UI until checked)

- Exact Köppen periods, scenarios, resolution, license, and download links for the Beck et al. maps.
- WorldClim present and CMIP6 future availability, periods, and licenses.
- Open-Meteo endpoints, fields, rate limits, and terms (forecast, air quality, normals, geocoding).
- Any statistic recalled from papers (for example the share of cities facing unprecedented climates, city-analogue examples like London → Barcelona, share of land changing class). Prefer the numbers our pipeline computes.
- Every resilience-plan entry (hazard outlook per zone and transition, evidence that the action reduces risk, any cost claims) and every sister-place pair against its source.
- Central Kenya highland crop-zone claims (tea, coffee) against Kenya-specific studies before mentioning them.
- Satellite layer availability and terms.
- Vercel plan limits and terms (function timeout and size, bandwidth, static file size, free-tier usage terms), the current handler signature and runtime support, and whether `.bin` responses are compressed.

## 17. Environment variables

```
GEMINI_API_KEY=            # Vercel Function only; never prefix with VITE_
VITE_DEFAULT_SCENARIO=ssp245
```

## 18. Open items for the user

1. **Forecast/observation dataset:** source, variables, locations, date range, daily or monthly, lead times. Needed to confirm the canonical schema in 7.5 and to decide if F9 stays in scope.
2. Primary test region (central Kenya is a good candidate because it spans several zones; confirm the classes on the map).
3. Preferred languages for alerts.
4. Name of the supporting similar-future-climate feature (for example "Kepler Twin" or plain "Climate Twin"). It stays a small reference, not the headline.
5. Which audiences to prioritize for resilience plans (farmers, households, planners) and which hazards matter most in the test region.
6. Vercel account and project name, which plan tier will be used, and whether the free tier's terms suit a hackathon entry.