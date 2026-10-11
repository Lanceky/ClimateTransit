# ClimateTransit — implementation.md

> A 7-step build plan to ship ClimateTransit and win CodeRED: Orion.
> Deadline: **Oct 11, 2026 @ 9:00pm GMT+3** (~5 hours). Derived from `conttext.md`.
> Targeted tracks: **Best Environment Hack ($500)** → **Best Pitch/Demo ($500)** → **Best Overall ($1,000)** → **Best Use of Gemini API**.

## Guiding rule (read first)

A smaller project that works live beats a larger one that breaks. Protect the **"never cut" core**: spinning globe → click panel → accurate slider → shift counter → resilience plan → Gemini brief. Everything else is optional. Honesty labels (SIMULATED, "projection not prediction", model-vs-satellite, "helps reduce risk") are non-negotiable and are how we win the Environment and Overall tracks on *technical implementation* and *impact*.

Time budget below assumes ~5 hours. Deploy on step 1, not at the end.

---

## Step 1 — Scaffold + deploy the empty shell to Vercel (30 min)

Goal: a live URL on day one so deployment problems surface early.

- `npm create vite@latest frontend -- --template react-ts`, add Tailwind, `react-globe.gl`, `three`, `zustand`, `lucide-react`, `recharts`.
- Create `frontend/vercel.json` (SPA rewrite + `/data/*` cache headers from `conttext.md` §5.1) and `frontend/api/summary.ts` stub returning `{ text, model, cached }`.
- Add `.env.example` with `GEMINI_API_KEY` (no `VITE_` prefix) and `VITE_DEFAULT_SCENARIO=ssp245`. Commit `.gitignore` for `.env.local`.
- Import repo into Vercel: **Root Directory = `frontend`**, framework **Vite**, build `npm run build`, output `dist`. Set `GEMINI_API_KEY` in Production + Preview env vars.
- **Done when:** the deployed URL renders a placeholder page and `/api/summary` responds.

## Step 2 — Data pipeline: Köppen grids + manifest + shift stats (60 min)

Goal: the static data that drives the slider, globe texture, and headline counter. This is the scientific credibility that wins the Environment track.

- In `data-pipeline/`, download Köppen–Geiger maps (Beck et al. 2023 preferred; 2018 two-period fallback). Record exact URLs + licenses in `01_download.md`.
- `02_build_koppen_grids.py`: resample to **0.5° (720×360)** with **majority (mode)** resampling, store `Uint8Array` class grids as `koppen_{scenario}_{period}.bin` (gzip). Emit `manifest.json` ( `{id, scenario, label, startYear, endYear, file, kind}` + resolution + bounds). **Slider stops come only from this file.**
- `03_build_shift_stats.py`: area-weighted (`cos(lat)`) share of land cells changing class per projection period/scenario → `shift_stats.json`.
- Write `koppen_legend.json` (code, name, color, description, hazards). Put all outputs under `frontend/public/data/`.
- **Done when:** manifest lists real periods, grids load, and a spot check passes (Cairo=BWh, Singapore=Af, London=Cfb, Moscow=Dfb).

## Step 3 — Globe core: texture, click → zone, manifest-driven slider (60 min)

Goal: the demo hook and the "never cut" spine.

- `src/lib/grid.ts`: lat/lng ↔ cell index with longitude wrap (±180°) and pole clamping — **unit test this**.
- `src/lib/textures.ts`: build the equirectangular Köppen texture on a canvas from the grid + legend colors; feed as `globeImageUrl`.
- `Globe` component: auto-rotate when idle (pause on pointer, stop when a point is selected, respect `prefers-reduced-motion`), drag-rotate, zoom limits, atmosphere + starfield.
- `onGlobeClick({lat,lng})` → drop pin, pulse ring, fly camera, open panel shell. Zone lookup is an instant grid read (no server).
- `TimeSlider` built from `manifest.json` (real period labels, historical vs projection, scenario toggle only on projections) → crossfades texture + updates shift counter and panel's "zone at selected period".
- **Done when:** globe spins, a click shows the correct zone now-vs-period, slider swaps textures with real labels, and the counter reads from `shift_stats.json`.

## Step 4 — Place data: live weather, risk chips, search, responsive layout (50 min)

Goal: makes every click useful and the app usable one-handed on a phone (the Demo criterion).

- `src/lib/openmeteo.ts`: forecast (current + 7-day + UV), air quality (PM2.5/PM10/dust — **label model-based/CAMS**), and 30-year normals for anomalies. All client-side, no key.
- `RiskChips`: Heat (fc max vs normal), Dry/Wet (7-day precip vs normal), UV, Air — thresholds in config, formulas in an info tooltip, "limited data" state when inputs missing.
- `SearchBox`: geocoding + fly-to (also the keyboard/accessibility fallback). Reverse lookup for place names.
- Responsive: desktop right glass panel + bottom-docked slider; mobile (<1024px) bottom sheet with snap points, 44px touch targets. First-run hint.
- Every panel section needs loading + error states; on API failure degrade gracefully — **never fabricate values**.
- **Done when:** tapping a place on a phone shows weather + risk chips; search flies to a city; no horizontal scroll on mobile.

## Step 5 — Resilience Plan engine + Gemini brief (60 min) — the winning feature

Goal: the core output and the Environment/Overall differentiator. Insight must end in action.

- Curate `resilience_plans.json` by Köppen main group + notable transitions. Each item: `{id, zoneOrTransition, hazard, title, why, action, audience, horizon, earlyWarning, evidenceNote, sourceUrl, whereItWorks?}`. Use FAO/IPCC/national/peer-reviewed sources. Include a clearly-labeled **generic fallback** for uncovered classes.
- `ResiliencePlan` UI: for the selected place/period show **what's changing → what adversity → what to do**, grouped by horizon (now / this season / long term) and filterable by audience (farmer / household / planner), plus early-warning signs. Each action links its source. Language: "helps reduce risk" / "helps prevent" + a line to confirm with local experts.
- Wire `RiskChips` to their matching plan actions.
- Implement `api/summary.ts`: validate body, build a **facts-only** prompt from `server/prompts.ts`, call Gemini with a hard output cap + explicit max duration, cache by payload hash, return `{text, model, cached}`. **Gemini may rephrase but must not invent actions.** On failure, return a template sentence built from the same facts.
- **Done when:** every zone renders a sourced plan, the audience selector re-filters, and the Gemini brief (≤100 words) streams in with a working template fallback.

## Step 6 — Trust + planner: honesty labels, reliability slot, planner view (40 min)

Goal: the "why you can trust it" demo beat (Technical Implementation + Impact).

- Add persistent badges: scenario/period, "projection, not prediction" on future views, SIMULATED where relevant, and an "About these data" link listing Köppen limits (monthly temp/rainfall only; sharp borders; land only).
- `PlannerView` toggle: country ranking of land-share changing zone for the selected period/scenario (from `shift_stats.json`) + CSV download + method note.
- Forecast reliability (F9): **only if** the user's forecast/observation dataset is ready — run `05_forecast_eval.py` (chronological 70/15/15 split, per-zone/per-lead bias correction → `reliability.json`) and show the ReliabilityCard. If not ready by now, **cut the module and its UI slot** rather than showing placeholder numbers.
- **Done when:** badges are visible, planner table + CSV work and match an independent recompute, and no unlabeled simulated/model data appears.

## Step 7 — Polish, verify, ship + submit (40 min)

Goal: a smooth live demo and a complete submission.

- Verify every item currently in the UI against the `conttext.md` §16 VERIFY list; remove anything unverified. Run grid/manifest/shift unit tests and the spot-check cities.
- Pre-demo checks on the **production URL from a phone**: `/data/*` loads + cached, `/api/summary` works in Production and a Preview, and `grep` the `dist` build to confirm **no `GEMINI_API_KEY` leaked** into the browser bundle.
- Write `README.md`: what it does, data sources + licenses, honesty notes, how to run, screenshots. Record a short backup demo video.
- Rehearse the 3-minute demo script (§14): hook → click home town → slide time forward → resilience plan by audience → trust (reliability + model/satellite labels) → planner → honest-limits close.
- Submit on Devpost: live link + repo, tracks = **Environment, Pitch/Demo, Overall, Gemini**. Complete the §13 checklist.
- **Stretch only if ahead** (cut order): sister gallery → satellite layer → planet heartbeat → simulated sensor trust demo → color-blind palette → 0.1° grids.
- **Done when:** the submission checklist is fully green and the live demo runs end-to-end without errors.

---

## Won't-cut vs cut-first (quick reference)

- **Never cut:** globe, click panel, accurate manifest-driven slider, shift counter, resilience plan, Gemini brief, honesty labels.
- **Cut in this order if short on time:** sensor trust demo → planet heartbeat → satellite layer → sister gallery → planner CSV → reliability layer.
