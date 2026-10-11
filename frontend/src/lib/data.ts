// data.ts — fetch manifest, legend, shift stats, and grid binaries.

import type { Manifest, PeriodEntry } from './grid';
import type { Legend } from './koppen';

const BASE = '/data';

export interface Transition {
  from: string;
  to: string;
  pctOfChanged: number;
}

export interface CountryRank {
  country: string;
  pct: number;
  landCells: number;
}

export interface ShiftPeriod {
  scenario: string;
  label: string;
  pctLandChangingZone: number;
  topTransitions: Transition[];
  countryRanking: CountryRank[];
}

export interface ShiftStats {
  baselineId: string;
  baselineLabel: string;
  method: string;
  dataSource: string;
  periods: Record<string, ShiftPeriod>;
}

export async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchManifest(): Promise<Manifest> {
  return fetchJson<Manifest>('manifest.json');
}

export async function fetchLegend(): Promise<Legend> {
  return fetchJson<Legend>('koppen_legend.json');
}

export async function fetchShiftStats(): Promise<ShiftStats> {
  return fetchJson<ShiftStats>('shift_stats.json');
}

export async function fetchGrid(entry: PeriodEntry): Promise<Uint8Array> {
  const res = await fetch(`${BASE}/${entry.file}`);
  if (!res.ok) throw new Error(`Failed to load grid ${entry.file}: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}
