import { useMemo } from 'react';
import { X, Download, BarChart3 } from 'lucide-react';
import { useStore } from '../state/store';

export function PlannerView() {
  const plannerOpen = useStore((s) => s.plannerOpen);
  const setPlannerOpen = useStore((s) => s.setPlannerOpen);
  const shiftStats = useStore((s) => s.shiftStats);
  const currentPeriod = useStore((s) => s.currentPeriod);
  const baselinePeriod = useStore((s) => s.baselinePeriod);

  const period = currentPeriod();
  const usePeriod =
    period && period.kind === 'projection' ? period : null;

  const ranking = useMemo(() => {
    if (!usePeriod || !shiftStats) return [];
    return shiftStats.periods[usePeriod.id]?.countryRanking ?? [];
  }, [usePeriod, shiftStats]);

  if (!plannerOpen) return null;

  const downloadCsv = () => {
    const base = baselinePeriod()?.label ?? 'baseline';
    const header = `country,pct_land_changing_zone,land_cells,baseline,period,scenario\n`;
    const rows = ranking
      .map(
        (r) =>
          `"${r.country}",${r.pct},${r.landCells},"${base}","${usePeriod?.label}","${usePeriod?.scenario}"`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `climatetransit_planner_${usePeriod?.id ?? 'period'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={() => setPlannerOpen(false)}
    >
      <div
        className="glass rounded-2xl p-6 w-[min(640px,94vw)] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-cyan-300" />
            <h2 className="text-lg font-bold text-slate-100">Planner view</h2>
          </div>
          <button
            onClick={() => setPlannerOpen(false)}
            className="text-slate-400 hover:text-white"
            aria-label="Close planner"
          >
            <X size={18} />
          </button>
        </div>

        {!usePeriod ? (
          <p className="mt-4 text-sm text-slate-300">
            Move the time slider to a future projection period to rank countries by
            land-share changing climate zone.
          </p>
        ) : ranking.length === 0 ? (
          <p className="mt-4 text-sm text-slate-300">
            No ranking available for {usePeriod.label}.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-slate-400">
                Share of land changing Köppen zone by {usePeriod.label} ·{' '}
                {usePeriod.scenario.toUpperCase()}
              </div>
              <button
                onClick={downloadCsv}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-cyan-400 text-slate-900 font-medium"
              >
                <Download size={13} />
                CSV
              </button>
            </div>

            <table className="w-full mt-3 text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-1.5 pr-2">#</th>
                  <th className="py-1.5 pr-2">Country</th>
                  <th className="py-1.5 pr-2 text-right">% land changing</th>
                  <th className="py-1.5 text-right">Land cells</th>
                </tr>
              </thead>
              <tbody>
                {ranking.slice(0, 25).map((r, i) => (
                  <tr key={r.country} className="border-t border-white/5">
                    <td className="py-1.5 pr-2 text-slate-500">{i + 1}</td>
                    <td className="py-1.5 pr-2 text-slate-100">{r.country}</td>
                    <td className="py-1.5 pr-2 text-right text-cyan-300 font-semibold">
                      {r.pct.toFixed(1)}%
                    </td>
                    <td className="py-1.5 text-right text-slate-400">{r.landCells}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Method: area-weighted (cos latitude) share of each country&apos;s land
              cells whose Köppen class differs from the {baselinePeriod()?.label}{' '}
              baseline. Computed from the project&apos;s own grids; small territories
              (few cells) can read 100%.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
