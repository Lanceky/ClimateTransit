// textures.ts — build an equirectangular globe texture (data URL) from a
// Köppen class grid + the legend colors.

import type { GridMeta } from './grid';
import type { Legend } from './koppen';
import { colorLookup } from './koppen';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

const OCEAN: [number, number, number] = [8, 16, 36];

/**
 * Render the class grid to a canvas and return a PNG data URL suitable for
 * react-globe.gl's `globeImageUrl`. Upscales by `scale` for a crisper sphere.
 */
export function buildGlobeTexture(
  gridData: Uint8Array,
  grid: GridMeta,
  legend: Legend,
  scale = 2,
): string {
  const colors = colorLookup(legend).map(hexToRgb);
  const { width, height, oceanId } = grid;

  const base = document.createElement('canvas');
  base.width = width;
  base.height = height;
  const ctx = base.getContext('2d')!;
  const img = ctx.createImageData(width, height);

  for (let i = 0; i < width * height; i++) {
    const id = gridData[i];
    const rgb = id === oceanId ? OCEAN : colors[id] ?? OCEAN;
    const o = i * 4;
    img.data[o] = rgb[0];
    img.data[o + 1] = rgb[1];
    img.data[o + 2] = rgb[2];
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  if (scale === 1) return base.toDataURL('image/png');

  const up = document.createElement('canvas');
  up.width = width * scale;
  up.height = height * scale;
  const uctx = up.getContext('2d')!;
  uctx.imageSmoothingEnabled = false;
  uctx.drawImage(base, 0, 0, up.width, up.height);
  return up.toDataURL('image/png');
}

/**
 * Procedural starfield as a PNG data URL for the globe background. Generated
 * locally so the deployed demo never depends on an external CDN image.
 */
export function buildStarfield(
  width = 2048,
  height = 1024,
  stars = 1400,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#05070f');
  bg.addColorStop(1, '#070b1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Deterministic PRNG so the field is stable across renders.
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let i = 0; i < stars; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = rand() * 1.3 + 0.2;
    const a = rand() * 0.6 + 0.2;
    const tint = rand();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle =
      tint > 0.85
        ? `rgba(150,220,255,${a})`
        : tint < 0.15
          ? `rgba(255,220,180,${a})`
          : `rgba(255,255,255,${a})`;
    ctx.fill();
  }
  return canvas.toDataURL('image/png');
}
