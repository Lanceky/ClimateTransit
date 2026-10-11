// openmeteo.ts — client-side Open-Meteo calls (no API key required).
// Forecast + UV, air quality (CAMS model), and forward geocoding.

const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const AIR = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';

export interface Weather {
  currentTempC: number | null;
  dailyMaxC: number[];
  dailyMinC: number[];
  precip7dMm: number;
  uvMax: number | null;
  days: string[];
}

export interface AirQuality {
  pm25: number | null;
  pm10: number | null;
  dust: number | null;
}

export interface GeoResult {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchWeather(lat: number, lng: number): Promise<Weather> {
  const url =
    `${FORECAST}?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max` +
    `&forecast_days=7&timezone=auto`;
  const d = await getJson<{
    current?: { temperature_2m?: number };
    daily?: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      uv_index_max: number[];
    };
  }>(url);
  const daily = d.daily;
  const precip = daily?.precipitation_sum ?? [];
  const uv = daily?.uv_index_max ?? [];
  return {
    currentTempC: d.current?.temperature_2m ?? null,
    dailyMaxC: daily?.temperature_2m_max ?? [],
    dailyMinC: daily?.temperature_2m_min ?? [],
    precip7dMm: precip.reduce((a, b) => a + (b ?? 0), 0),
    uvMax: uv.length ? Math.max(...uv) : null,
    days: daily?.time ?? [],
  };
}

export async function fetchAirQuality(
  lat: number,
  lng: number,
): Promise<AirQuality> {
  const url =
    `${AIR}?latitude=${lat}&longitude=${lng}` +
    `&current=pm2_5,pm10,dust`;
  const d = await getJson<{
    current?: { pm2_5?: number; pm10?: number; dust?: number };
  }>(url);
  return {
    pm25: d.current?.pm2_5 ?? null,
    pm10: d.current?.pm10 ?? null,
    dust: d.current?.dust ?? null,
  };
}

export async function geocode(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const url = `${GEOCODE}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const d = await getJson<{ results?: GeoResult[] }>(url);
  return d.results ?? [];
}
