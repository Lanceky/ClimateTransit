import { useStore } from '../state/store';

export function ShiftCounter() {
  const shiftStats = useStore((s) => s.shiftStats);
  const currentPeriod = useStore((s) => s.currentPeriod);

  const period = currentPeriod();
  if (!period) return null;

  if (period.kind === 'historical') {
    return (
      <div className="glass rounded-2xl px-5 py-3">
        <div className="text-xs uppercase tracking-wider text-slate-400">Baseline</div>
        <div className="text-lg font-semibold text-slate-100">
          {period.label} climate normals
        </div>
      </div>
    );
  }

  const stat = shiftStats?.periods[period.id];
  if (!stat) return null;

  return (
    <div className="glass rounded-2xl px-5 py-3 max-w-xs">
      <div className="text-xs uppercase tracking-wider text-slate-400">
        Climate in transit
      </div>
      <div className="text-3xl font-bold text-cyan-300 text-glow">
        {stat.pctLandChangingZone}%
      </div>
      <div className="text-sm text-slate-200 leading-snug">
        of Earth&apos;s land changes climate zone by {period.label}
      </div>
      <div className="text-[11px] text-slate-400 mt-1">
        area-weighted · {stat.scenario.toUpperCase()}
      </div>
    </div>
  );
}
