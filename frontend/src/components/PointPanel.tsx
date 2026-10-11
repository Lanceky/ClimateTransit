import { useMemo, useState } from 'react';
import { X, ArrowRight, MapPin } from 'lucide-react';
import { useStore } from '../state/store';
import { buildClassMap, groupName } from '../lib/koppen';
import { RiskChips } from './RiskChips';
import { ResiliencePlan } from './ResiliencePlan';
import { GeminiBrief } from './GeminiBrief';
import type { PlanItem } from '../lib/plans';
import type { Risk } from '../lib/risk';

function season(lat: number, monthIdx: number): string {
  const north = lat >= 0;
  // meteorological seasons
  const s = ['Winter', 'Spring', 'Summer', 'Autumn'];
  const nhIdx = [11, 0, 1].includes(monthIdx)
    ? 0
    : [2, 3, 4].includes(monthIdx)
      ? 1
      : [5, 6, 7].includes(monthIdx)
        ? 2
        : 3;
  const idx = north ? nhIdx : (nhIdx + 2) % 4;
  return s[idx];
}

// Read once at module load; "current season" does not need to be reactive.
const CURRENT_MONTH = new Date().getMonth();

export function PointPanel() {
  const selected = useStore((s) => s.selected);
  const legend = useStore((s) => s.legend);
  const manifest = useStore((s) => s.manifest);
  const plans = useStore((s) => s.plans);
  const classIdAt = useStore((s) => s.classIdAt);
  const baselinePeriod = useStore((s) => s.baselinePeriod);
  const currentPeriod = useStore((s) => s.currentPeriod);
  const selectPoint = useStore((s) => s.selectPoint);

  const [risks, setRisks] = useState<Risk[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);

  const classMap = useMemo(
    () => (legend ? buildClassMap(legend) : null),
    [legend],
  );

  if (!selected || !classMap || !manifest) return null;

  const base = baselinePeriod();
  const cur = currentPeriod();
  const nowId = base ? classIdAt(selected.lat, selected.lng, base.id) : 0;
  const futId = cur ? classIdAt(selected.lat, selected.lng, cur.id) : 0;
  const now = classMap.get(nowId);
  const fut = classMap.get(futId);
  const changed = nowId !== futId && futId !== 0 && nowId !== 0;
  const isOcean = nowId === 0 && futId === 0;

  const north = selected.lat >= 0;
  const seasonNow = season(selected.lat, CURRENT_MONTH);

  return (
    <aside className="glass rounded-2xl p-5 w-[min(400px,94vw)] max-h-[82vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-cyan-300">
            <MapPin size={15} />
            <span className="text-sm font-semibold">
              {selected.name ?? 'Selected location'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {selected.lat.toFixed(2)}°, {selected.lng.toFixed(2)}° ·{' '}
            {north ? 'Northern' : 'Southern'} hemisphere · {seasonNow}
          </div>
        </div>
        <button
          onClick={() => selectPoint(null)}
          className="text-slate-400 hover:text-white"
          aria-label="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      {isOcean ? (
        <div className="mt-4 text-sm text-slate-300">
          Köppen zones cover land. This point is over water — try clicking a
          landmass to see its climate zone and how it shifts.
        </div>
      ) : (
        <>
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1.5">
              Climate zone {changed ? '· now vs ' + cur?.label : ''}
            </div>
            <div className="flex items-center gap-3">
              <ZoneChip code={now?.code} name={now?.name} color={now?.color}
                        group={now?.group} />
              {changed && (
                <>
                  <ArrowRight size={18} className="text-cyan-300 shrink-0" />
                  <ZoneChip code={fut?.code} name={fut?.name} color={fut?.color}
                            group={fut?.group} />
                </>
              )}
            </div>
            {changed ? (
              <div className="mt-2 text-sm text-amber-300">
                This place shifts from {now?.name} to {fut?.name} by {cur?.label}.
                <span className="text-slate-400"> (projection, not prediction)</span>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-300">
                Stays {now?.name} through {cur?.label}.
              </div>
            )}
          </div>

          {(changed ? fut : now)?.hazards?.length ? (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                Adversities this zone can bring
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(changed ? fut : now)!.hazards.map((hz) => (
                  <span
                    key={hz}
                    className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-200"
                  >
                    {hz}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <RiskChips lat={selected.lat} lng={selected.lng} onRisks={setRisks} />
          </div>

          <div className="mt-4">
            <ResiliencePlan
              plans={plans}
              group={(changed ? fut : now)?.group}
              onItems={setPlanItems}
            />
          </div>

          <div className="mt-4">
            <GeminiBrief
              place={selected.name ?? 'This location'}
              zoneNow={now?.code ?? '—'}
              zoneFuture={(changed ? fut?.code : now?.code) ?? '—'}
              period={cur?.label ?? ''}
              scenario={cur?.scenario ?? ''}
              plans={planItems}
              risks={risks}
              forecastBrief={
                risks.length
                  ? risks.map((r) => `${r.type} ${r.level} (${r.detail})`).join('; ')
                  : 'No live forecast available.'
              }
            />
          </div>

          <div className="mt-4 rounded-xl bg-white/5 p-3 text-[11px] text-slate-400 leading-relaxed">
            Köppen zones use monthly temperature and rainfall only — borders are
            sharp lines drawn over gradual change, and cover land, not oceans.
          </div>
        </>
      )}
    </aside>
  );
}

function ZoneChip({
  code,
  name,
  color,
  group,
}: {
  code?: string;
  name?: string;
  color?: string;
  group?: string;
}) {
  if (!code) return null;
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-4 h-4 rounded-sm shrink-0"
        style={{ background: color }}
      />
      <div>
        <div className="text-sm font-semibold text-slate-100">
          {name} <span className="text-slate-400">({code})</span>
        </div>
        <div className="text-[11px] text-slate-400">{groupName(group ?? '')}</div>
      </div>
    </div>
  );
}
