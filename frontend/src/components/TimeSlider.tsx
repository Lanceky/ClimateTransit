import { useStore } from '../state/store';

const SCENARIO_LABELS: Record<string, string> = {
  historical: 'Historical',
  ssp126: 'SSP1-2.6',
  ssp245: 'SSP2-4.5',
  ssp585: 'SSP5-8.5',
};

export function TimeSlider() {
  const manifest = useStore((s) => s.manifest);
  const scenario = useStore((s) => s.scenario);
  const periodId = useStore((s) => s.periodId);
  const setScenario = useStore((s) => s.setScenario);
  const setPeriod = useStore((s) => s.setPeriod);
  const visiblePeriods = useStore((s) => s.visiblePeriods);

  if (!manifest) return null;
  const periods = visiblePeriods();
  const idx = Math.max(0, periods.findIndex((p) => p.id === periodId));

  const projectionScenarios = manifest.scenarios.filter((s) => s !== 'historical');

  return (
    <div className="glass rounded-2xl px-5 py-4 w-[min(680px,92vw)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5">
          {projectionScenarios.map((s) => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                scenario === s
                  ? 'bg-cyan-400 text-slate-900'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {SCENARIO_LABELS[s] ?? s}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">
          {manifest.dataSource?.startsWith('PLACEHOLDER') ? 'projection, not prediction' : ''}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={periods.length - 1}
        value={idx}
        step={1}
        onChange={(e) => setPeriod(periods[Number(e.target.value)].id)}
        className="w-full accent-cyan-400"
        aria-label="Time period"
      />

      <div className="flex justify-between mt-2">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`text-center ${
              p.id === periodId ? 'text-cyan-300 font-semibold' : 'text-slate-400'
            }`}
          >
            <div className="text-[11px] leading-tight">{p.label}</div>
            <div className="text-[9px] uppercase tracking-wide opacity-70">
              {p.kind === 'historical' ? 'observed' : 'projection'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
