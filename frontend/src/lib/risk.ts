// risk.ts — transparent, absolute thresholds for the risk chips.
// Formulas live here (shown in tooltips); values are never fabricated —
// a missing input yields a "limited data" chip instead of a guess.

import type { Weather, AirQuality } from './openmeteo';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Very high' | 'Extreme' | 'Unknown';

export interface Risk {
  type: 'Heat' | 'Dry/Wet' | 'UV' | 'Air';
  level: RiskLevel;
  detail: string;
  formula: string;
}

const LEVEL_ORDER: RiskLevel[] = ['Low', 'Moderate', 'High', 'Very high', 'Extreme'];

export function levelColor(level: RiskLevel): string {
  switch (level) {
    case 'Low':
      return '#34d399';
    case 'Moderate':
      return '#fbbf24';
    case 'High':
      return '#fb923c';
    case 'Very high':
      return '#f87171';
    case 'Extreme':
      return '#ef4444';
    default:
      return '#64748b';
  }
}

function band(value: number, stops: number[], labels: RiskLevel[]): RiskLevel {
  for (let i = 0; i < stops.length; i++) {
    if (value < stops[i]) return labels[i];
  }
  return labels[labels.length - 1];
}

export function heatRisk(w: Weather | null): Risk {
  const formula = 'Peak daily high over the next 7 days vs fixed heat-stress bands (°C).';
  if (!w || !w.dailyMaxC.length) {
    return { type: 'Heat', level: 'Unknown', detail: 'limited data', formula };
  }
  const peak = Math.max(...w.dailyMaxC);
  const level = band(peak, [28, 33, 38, 43], ['Low', 'Moderate', 'High', 'Very high', 'Extreme']);
  return { type: 'Heat', level, detail: `peak ${peak.toFixed(0)}°C this week`, formula };
}

export function moistureRisk(w: Weather | null): Risk {
  const formula = '7-day total precipitation vs dry/wet bands (mm).';
  if (!w) return { type: 'Dry/Wet', level: 'Unknown', detail: 'limited data', formula };
  const mm = w.precip7dMm;
  // Two-sided: dryness and wetness both raise the level.
  let level: RiskLevel;
  let detail: string;
  if (mm < 2) {
    level = 'High';
    detail = `very dry · ${mm.toFixed(0)} mm/7d`;
  } else if (mm < 10) {
    level = 'Moderate';
    detail = `dry · ${mm.toFixed(0)} mm/7d`;
  } else if (mm < 60) {
    level = 'Low';
    detail = `${mm.toFixed(0)} mm/7d`;
  } else if (mm < 120) {
    level = 'High';
    detail = `wet · ${mm.toFixed(0)} mm/7d`;
  } else {
    level = 'Very high';
    detail = `very wet · ${mm.toFixed(0)} mm/7d`;
  }
  return { type: 'Dry/Wet', level, detail, formula };
}

export function uvRisk(w: Weather | null): Risk {
  const formula = 'Max UV index (WHO bands): <3 Low, 3–6 Moderate, 6–8 High, 8–11 Very high, 11+ Extreme.';
  if (!w || w.uvMax == null) {
    return { type: 'UV', level: 'Unknown', detail: 'limited data', formula };
  }
  const level = band(w.uvMax, [3, 6, 8, 11], ['Low', 'Moderate', 'High', 'Very high', 'Extreme']);
  return { type: 'UV', level, detail: `index ${w.uvMax.toFixed(0)}`, formula };
}

export function airRisk(a: AirQuality | null): Risk {
  const formula = 'Surface PM2.5 from the CAMS model (µg/m³) vs WHO/AQI bands. Model-based, not a station reading.';
  if (!a || a.pm25 == null) {
    return { type: 'Air', level: 'Unknown', detail: 'limited data', formula };
  }
  const level = band(a.pm25, [12, 35, 55, 150], ['Low', 'Moderate', 'High', 'Very high', 'Extreme']);
  return { type: 'Air', level, detail: `PM2.5 ${a.pm25.toFixed(0)} µg/m³ (model)`, formula };
}

export function worstLevel(risks: Risk[]): RiskLevel {
  let worst = -1;
  for (const r of risks) {
    const i = LEVEL_ORDER.indexOf(r.level);
    if (i > worst) worst = i;
  }
  return worst >= 0 ? LEVEL_ORDER[worst] : 'Unknown';
}
