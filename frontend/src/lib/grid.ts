// grid.ts — manifest types + lat/lng <-> cell-index math.
// Convention MUST match the Python pipeline (common.py):
//   width 720, height 360, res 0.5, row 0 = north (lat +90..-90),
//   col 0 = lon -180..180, cell center = edge + 0.5*res.

export interface GridMeta {
  width: number;
  height: number;
  res: number;
  bounds: [number, number, number, number];
  rowOrder: string;
  oceanId: number;
  dtype: string;
}

export interface PeriodEntry {
  id: string;
  scenario: string;
  label: string;
  startYear: number;
  endYear: number;
  file: string;
  kind: 'historical' | 'projection';
}

export interface Manifest {
  dataSource: string;
  note: string;
  grid: GridMeta;
  scenarios: string[];
  baselineId: string;
  periods: PeriodEntry[];
}

/** Wrap longitude into [-180, 180). */
export function wrapLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

/** Clamp latitude into [-90, 90]. */
export function clampLat(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

export function lonToCol(lon: number, grid: GridMeta): number {
  const w = wrapLon(lon);
  let col = Math.floor((w - grid.bounds[0]) / grid.res);
  if (col < 0) col = 0;
  if (col >= grid.width) col = grid.width - 1;
  return col;
}

export function latToRow(lat: number, grid: GridMeta): number {
  const c = clampLat(lat);
  // row 0 = north (lat = +90). Clamp the exact pole to the last row.
  let row = Math.floor((grid.bounds[3] - c) / grid.res);
  if (row < 0) row = 0;
  if (row >= grid.height) row = grid.height - 1;
  return row;
}

export function cellIndex(lat: number, lon: number, grid: GridMeta): number {
  return latToRow(lat, grid) * grid.width + lonToCol(lon, grid);
}

/** Class ID at a location (0 = ocean/no-data). */
export function classAt(
  lat: number,
  lon: number,
  gridData: Uint8Array,
  grid: GridMeta,
): number {
  return gridData[cellIndex(lat, lon, grid)] ?? grid.oceanId;
}
