// store.ts — global app state (Zustand).

import { create } from 'zustand';
import type { Manifest, PeriodEntry } from '../lib/grid';
import { classAt } from '../lib/grid';
import type { Legend } from '../lib/koppen';
import type { ResiliencePlans } from '../lib/plans';
import { fetchPlans } from '../lib/plans';
import {
  fetchGrid,
  fetchLegend,
  fetchManifest,
  fetchShiftStats,
  type ShiftStats,
} from '../lib/data';

export interface SelectedPoint {
  lat: number;
  lng: number;
  name?: string;
}

interface AppState {
  manifest: Manifest | null;
  legend: Legend | null;
  shiftStats: ShiftStats | null;
  plans: ResiliencePlans | null;
  grids: Record<string, Uint8Array>;
  scenario: string;
  periodId: string;
  selected: SelectedPoint | null;
  plannerOpen: boolean;
  loading: boolean;
  error: string | null;

  init: () => Promise<void>;
  setScenario: (scenario: string) => void;
  setPeriod: (periodId: string) => void;
  selectPoint: (p: SelectedPoint | null) => void;
  setPlannerOpen: (open: boolean) => void;

  // selectors
  currentPeriod: () => PeriodEntry | null;
  baselinePeriod: () => PeriodEntry | null;
  visiblePeriods: () => PeriodEntry[];
  classIdAt: (lat: number, lng: number, periodId?: string) => number;
}

const DEFAULT_SCENARIO =
  (import.meta.env.VITE_DEFAULT_SCENARIO as string) || 'ssp245';

async function ensureGrid(
  get: () => AppState,
  set: (p: Partial<AppState>) => void,
  entry: PeriodEntry,
): Promise<void> {
  if (get().grids[entry.id]) return;
  const data = await fetchGrid(entry);
  set({ grids: { ...get().grids, [entry.id]: data } });
}

export const useStore = create<AppState>((set, get) => ({
  manifest: null,
  legend: null,
  shiftStats: null,
  plans: null,
  grids: {},
  scenario: DEFAULT_SCENARIO,
  periodId: '',
  selected: null,
  plannerOpen: false,
  loading: true,
  error: null,

  init: async () => {
    try {
      set({ loading: true, error: null });
      const [manifest, legend, shiftStats, plans] = await Promise.all([
        fetchManifest(),
        fetchLegend(),
        fetchShiftStats().catch(() => null),
        fetchPlans().catch(() => null),
      ]);

      const scenario = manifest.scenarios.includes(get().scenario)
        ? get().scenario
        : manifest.scenarios.find((s) => s !== 'historical') ?? 'historical';

      // Load the baseline grid and all grids for the active scenario up front.
      const baseline = manifest.periods.find((p) => p.id === manifest.baselineId);
      const scenarioPeriods = manifest.periods.filter(
        (p) => p.scenario === scenario,
      );
      const toLoad = [baseline, ...scenarioPeriods].filter(
        (p): p is PeriodEntry => !!p,
      );
      set({ manifest, legend, shiftStats, plans, scenario });
      await Promise.all(toLoad.map((p) => ensureGrid(get, set, p)));

      set({ periodId: manifest.baselineId, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  setScenario: (scenario) => {
    const { manifest } = get();
    if (!manifest) return;
    set({ scenario });
    // Preload the newly visible projection grids.
    const periods = manifest.periods.filter((p) => p.scenario === scenario);
    periods.forEach((p) => ensureGrid(get, set, p));
    // If current period belongs to another scenario, snap to baseline.
    const cur = manifest.periods.find((p) => p.id === get().periodId);
    if (cur && cur.kind === 'projection' && cur.scenario !== scenario) {
      set({ periodId: manifest.baselineId });
    }
  },

  setPeriod: (periodId) => {
    const { manifest } = get();
    const entry = manifest?.periods.find((p) => p.id === periodId);
    if (entry) {
      ensureGrid(get, set, entry);
      set({ periodId });
    }
  },

  selectPoint: (p) => set({ selected: p }),

  setPlannerOpen: (open) => set({ plannerOpen: open }),

  currentPeriod: () => {
    const { manifest, periodId } = get();
    return manifest?.periods.find((p) => p.id === periodId) ?? null;
  },

  baselinePeriod: () => {
    const { manifest } = get();
    return manifest?.periods.find((p) => p.id === manifest.baselineId) ?? null;
  },

  visiblePeriods: () => {
    const { manifest, scenario } = get();
    if (!manifest) return [];
    const periods = manifest.periods.filter(
      (p) => p.kind === 'historical' || p.scenario === scenario,
    );
    return periods.sort((a, b) => a.startYear - b.startYear);
  },

  classIdAt: (lat, lng, periodId) => {
    const { manifest, grids } = get();
    const pid = periodId ?? get().periodId;
    const grid = grids[pid];
    if (!manifest || !grid) return 0;
    return classAt(lat, lng, grid, manifest.grid);
  },
}));
