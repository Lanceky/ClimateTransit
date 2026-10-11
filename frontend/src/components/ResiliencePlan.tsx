import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import {
  groupByHorizon,
  selectPlans,
  HORIZON_ORDER,
  type Audience,
  type PlanItem,
  type ResiliencePlans,
} from '../lib/plans';

const AUDIENCES: (Audience | 'all')[] = ['all', 'farmer', 'household', 'planner'];

export function ResiliencePlan({
  plans,
  group,
  onItems,
}: {
  plans: ResiliencePlans | null;
  group: string | undefined;
  onItems?: (items: PlanItem[]) => void;
}) {
  const [audience, setAudience] = useState<Audience | 'all'>('all');

  const items = useMemo(() => selectPlans(plans, group), [plans, group]);
  const filtered = useMemo(
    () => (audience === 'all' ? items : items.filter((i) => i.audience === audience)),
    [items, audience],
  );

  // Surface the full set to the Gemini brief (audience-independent).
  useEffect(() => {
    onItems?.(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  if (!plans || !items.length) {
    return (
      <div className="text-xs text-slate-400">
        Resilience plan unavailable for this zone.
      </div>
    );
  }

  const byHorizon = groupByHorizon(filtered);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-slate-400">
          Resilience plan
        </div>
        <div className="flex gap-1">
          {AUDIENCES.map((a) => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize transition ${
                audience === a
                  ? 'bg-cyan-400 text-slate-900'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {HORIZON_ORDER.map((h) => {
        const hItems = byHorizon[h];
        if (!hItems.length) return null;
        return (
          <div key={h} className="mb-3">
            <div className="text-[11px] font-semibold text-cyan-300 capitalize mb-1.5">
              {h}
            </div>
            <div className="flex flex-col gap-2">
              {hItems.map((p) => (
                <PlanCard key={p.id} item={p} />
              ))}
            </div>
          </div>
        );
      })}

      {!HORIZON_ORDER.some((h) => byHorizon[h].length) && (
        <div className="text-xs text-slate-400">
          No actions for “{audience}”. Try another audience.
        </div>
      )}
    </div>
  );
}

function PlanCard({ item }: { item: PlanItem }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-100">{item.title}</div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300 capitalize shrink-0">
          {item.audience}
        </span>
      </div>
      <div className="text-xs text-slate-400 mt-1">{item.why}</div>
      <div className="text-xs text-slate-200 mt-1.5">{item.action}</div>
      <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-amber-300/90">
        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
        <span>Early sign: {item.earlyWarning}</span>
      </div>
      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:underline mt-1.5"
      >
        {item.evidenceNote}
        <ExternalLink size={11} />
      </a>
    </div>
  );
}
