import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useStore } from './state/store';
import { GlobeView } from './components/Globe';
import { TimeSlider } from './components/TimeSlider';
import { ShiftCounter } from './components/ShiftCounter';
import { PointPanel } from './components/PointPanel';
import { SampleBadge } from './components/SampleBadge';
import { SearchBox } from './components/SearchBox';
import { AboutData } from './components/AboutData';
import { PlannerView } from './components/PlannerView';
import { KoppenLegend } from './components/KoppenLegend';

export default function App() {
  const init = useStore((s) => s.init);
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const selected = useStore((s) => s.selected);
  const setPlannerOpen = useStore((s) => s.setPlannerOpen);
  const [hintDismissed, setHintDismissed] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="relative w-full h-full overflow-hidden" onPointerDown={() => setHintDismissed(true)}>
      <GlobeView />

      {/* Top-left: brand + sample badge + shift counter */}
      <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-glow text-slate-100">ClimateTransit</h1>
          <SampleBadge />
        </div>
        <ShiftCounter />
      </div>

      {/* Top-center: search */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <SearchBox />
      </div>

      {/* Top-right: planner + about */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setPlannerOpen(true)}
          className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5 text-slate-300 hover:text-white"
        >
          <BarChart3 size={13} />
          <span className="text-[11px] font-medium">Planner</span>
        </button>
        <AboutData />
      </div>

      {/* Right: point panel */}
      {selected && (
        <div className="absolute top-16 right-4 bottom-28 z-10 flex items-start">
          <PointPanel />
        </div>
      )}

      {/* Bottom-center: time slider */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        <TimeSlider />
      </div>

      {/* Bottom-left: Köppen legend */}
      <div className="absolute bottom-5 left-4 z-10">
        <KoppenLegend />
      </div>

      {/* First-run hint */}
      {!hintDismissed && !selected && !loading && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 glass rounded-full px-4 py-2 text-xs text-slate-300">
          Drag to spin · Tap anywhere to explore · Slide to travel in time
        </div>
      )}

      <PlannerView />

      {loading && (
        <div className="absolute inset-0 grid place-items-center z-20 text-slate-300">
          <div className="glass rounded-2xl px-6 py-4">Loading climate grids…</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center z-20">
          <div className="glass rounded-2xl px-6 py-4 text-red-300 max-w-sm">
            Could not load data: {error}
          </div>
        </div>
      )}
    </div>
  );
}
