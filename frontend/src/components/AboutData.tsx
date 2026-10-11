import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { useStore } from '../state/store';

export function AboutData() {
  const [open, setOpen] = useState(false);
  const manifest = useStore((s) => s.manifest);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5 text-slate-300 hover:text-white"
      >
        <Info size={13} />
        <span className="text-[11px] font-medium">About these data</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass rounded-2xl p-6 max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-100">About these data</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                <span className="text-cyan-300 font-semibold">Projection, not prediction.</span>{' '}
                Future views show one plausible climate under a chosen SSP scenario —
                not a forecast of a specific year.
              </p>
              <p>
                <span className="text-cyan-300 font-semibold">Köppen limits.</span>{' '}
                Zones are derived from monthly temperature and rainfall only. Borders
                are sharp lines drawn over gradual change, and the classification
                covers land, not oceans.
              </p>
              <p>
                <span className="text-cyan-300 font-semibold">Live weather &amp; air.</span>{' '}
                Forecasts come from Open-Meteo; air quality (PM2.5/PM10/dust) is CAMS
                model output, not a station reading. Risk chips use fixed, transparent
                thresholds shown on hover.
              </p>
              <p>
                <span className="text-cyan-300 font-semibold">Resilience actions</span>{' '}
                are sourced from FAO, IPCC, WHO and national agencies and use
                “helps reduce risk” language. Confirm actions with local experts.
              </p>
              {manifest?.dataSource?.startsWith('PLACEHOLDER') && (
                <p className="text-amber-300">
                  <span className="font-semibold">SAMPLE DATA.</span> {manifest.note}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
