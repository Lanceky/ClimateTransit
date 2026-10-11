import { useEffect, useState } from 'react';
import { Thermometer, Droplets, Sun, Wind } from 'lucide-react';
import type { Weather, AirQuality } from '../lib/openmeteo';
import { fetchWeather, fetchAirQuality } from '../lib/openmeteo';
import {
  heatRisk,
  moistureRisk,
  uvRisk,
  airRisk,
  levelColor,
  type Risk,
} from '../lib/risk';

const ICONS = {
  Heat: Thermometer,
  'Dry/Wet': Droplets,
  UV: Sun,
  Air: Wind,
} as const;

interface State {
  weather: Weather | null;
  air: AirQuality | null;
  status: 'loading' | 'ready' | 'error';
}

function useLocalRisks(lat: number, lng: number): State & { risks: Risk[] } {
  const [state, setState] = useState<State>({ weather: null, air: null, status: 'loading' });

  useEffect(() => {
    let alive = true;
    setState({ weather: null, air: null, status: 'loading' });
    Promise.allSettled([fetchWeather(lat, lng), fetchAirQuality(lat, lng)]).then(
      ([w, a]) => {
        if (!alive) return;
        const weather = w.status === 'fulfilled' ? w.value : null;
        const air = a.status === 'fulfilled' ? a.value : null;
        setState({
          weather,
          air,
          status: weather || air ? 'ready' : 'error',
        });
      },
    );
    return () => {
      alive = false;
    };
  }, [lat, lng]);

  const risks = [
    heatRisk(state.weather),
    moistureRisk(state.weather),
    uvRisk(state.weather),
    airRisk(state.air),
  ];
  return { ...state, risks };
}

export function RiskChips({
  lat,
  lng,
  onRisks,
}: {
  lat: number;
  lng: number;
  onRisks?: (risks: Risk[]) => void;
}) {
  const { weather, status, risks } = useLocalRisks(lat, lng);

  useEffect(() => {
    if (status === 'ready') onRisks?.(risks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, lat, lng]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-xs uppercase tracking-wider text-slate-400">
          Local risk now
        </div>
        {weather?.currentTempC != null && (
          <div className="text-xs text-slate-300">{weather.currentTempC.toFixed(0)}°C now</div>
        )}
      </div>

      {status === 'loading' ? (
        <div className="text-xs text-slate-500">Loading live weather…</div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {risks.map((r) => {
            const Icon = ICONS[r.type];
            const color = levelColor(r.level);
            return (
              <div
                key={r.type}
                title={r.formula}
                className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 cursor-help"
              >
                <Icon size={15} style={{ color }} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 leading-none">{r.type}</div>
                  <div className="text-xs font-semibold leading-tight" style={{ color }}>
                    {r.level}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{r.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="text-[10px] text-slate-500 mt-1.5">
        Live from Open-Meteo · air quality is CAMS model output · hover a chip for its formula.
      </div>
    </div>
  );
}
