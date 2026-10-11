import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  wrapLon,
  clampLat,
  cellIndex,
  classAt,
  lonToCol,
  latToRow,
  type GridMeta,
} from './grid';

const grid: GridMeta = {
  width: 720,
  height: 360,
  res: 0.5,
  bounds: [-180, -90, 180, 90],
  rowOrder: 'north-to-south',
  oceanId: 0,
  dtype: 'uint8',
};

describe('longitude wrap', () => {
  it('wraps values beyond ±180', () => {
    expect(wrapLon(190)).toBeCloseTo(-170);
    expect(wrapLon(-190)).toBeCloseTo(170);
    expect(wrapLon(540)).toBeCloseTo(-180); // 540 ≡ 180 ≡ -180 boundary
    expect(wrapLon(0)).toBe(0);
  });
  it('maps wrapped longitudes to valid columns', () => {
    expect(lonToCol(179.9, grid)).toBe(719);
    expect(lonToCol(-179.9, grid)).toBe(0);
    expect(lonToCol(185, grid)).toBe(lonToCol(-175, grid));
  });
});

describe('latitude clamp', () => {
  it('clamps poles into the grid', () => {
    expect(clampLat(95)).toBe(90);
    expect(clampLat(-95)).toBe(-90);
    expect(latToRow(90, grid)).toBe(0); // north pole -> first row
    expect(latToRow(-90, grid)).toBe(359); // south pole -> last row
  });
});

describe('cell index', () => {
  it('is within bounds for extreme coordinates', () => {
    for (const [lat, lng] of [
      [90, 180],
      [-90, -180],
      [0, 0],
      [45, 200],
      [-80, -400],
    ]) {
      const idx = cellIndex(lat, lng, grid);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(grid.width * grid.height);
    }
  });
});

describe('grid.ts agrees with the Python pipeline output', () => {
  // Cross-validate the TS convention against the real baseline grid + spot
  // checks confirmed when the grid was built (Sahara BWh=4, Congo Af=1,
  // Antarctica EF=30).
  const path = resolve(__dirname, '../../public/data/koppen_historical_1991_2020.bin');
  const data = new Uint8Array(readFileSync(path));

  it('has the expected byte length', () => {
    expect(data.length).toBe(grid.width * grid.height);
  });

  it('returns the pipeline-verified classes at known points', () => {
    expect(classAt(23, 13, data, grid)).toBe(4); // Sahara -> BWh
    expect(classAt(2, 22, data, grid)).toBe(1); // Congo -> Af
    expect(classAt(-80, 20, data, grid)).toBe(30); // Antarctica -> EF
  });

  it('reports ocean over open water', () => {
    expect(classAt(0, -30, data, grid)).toBe(0); // mid-Atlantic
  });
});
