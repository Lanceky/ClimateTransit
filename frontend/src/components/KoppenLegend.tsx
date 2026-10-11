import { useState } from 'react';
import { Layers, ChevronDown } from 'lucide-react';
import { useStore } from '../state/store';
import { groupName } from '../lib/koppen';

const GROUP_ORDER = ['A', 'B', 'C', 'D', 'E'];

export function KoppenLegend() {
  const legend = useStore((s) => s.legend);
  const [open, setOpen] = useState(false);

  if (!legend) return null;

  const byGroup = GROUP_ORDER.map((g) => ({
    group: g,
    classes: legend.classes.filter((c) => c.group === g),
  })).filter((g) => g.classes.length);

  return (
    <div className="glass rounded-2xl overflow-hidden w-[min(300px,86vw)]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <Layers size={15} className="text-cyan-300" />
          Köppen climate zones
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {!open && (
        <div className="flex gap-1 px-4 pb-3">
          {byGroup.map(({ group, classes }) => (
            <div
              key={group}
              className="h-2.5 flex-1 rounded-full"
              title={groupName(group)}
              style={{
                background: `linear-gradient(90deg, ${classes.map((c) => c.color).join(',')})`,
              }}
            />
          ))}
        </div>
      )}

      {open && (
        <div className="px-4 pb-3 max-h-[46vh] overflow-y-auto">
          {byGroup.map(({ group, classes }) => (
            <div key={group} className="mb-2.5">
              <div className="text-[11px] uppercase tracking-wider text-cyan-300 font-semibold mb-1">
                {group} · {groupName(group)}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {classes.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5" title={c.name}>
                    <span
                      className="inline-block w-3 h-3 rounded-sm shrink-0"
                      style={{ background: c.color }}
                    />
                    <span className="text-[11px] text-slate-200 truncate">
                      <span className="text-slate-400">{c.code}</span> {c.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="text-[10px] text-slate-500 leading-relaxed mt-1">
            Oceans are unclassified. Borders show country outlines — hover a country
            for its name, click anywhere to inspect a place.
          </div>
        </div>
      )}
    </div>
  );
}
