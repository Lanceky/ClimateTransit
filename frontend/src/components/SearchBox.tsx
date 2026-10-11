import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { geocode, type GeoResult } from '../lib/openmeteo';
import { useStore } from '../state/store';

export function SearchBox() {
  const selectPoint = useStore((s) => s.selectPoint);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timer.current = window.setTimeout(async () => {
      try {
        const r = await geocode(q);
        setResults(r);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [q]);

  const pick = (r: GeoResult) => {
    const name = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
    selectPoint({ lat: r.latitude, lng: r.longitude, name });
    setQ(r.name);
    setOpen(false);
  };

  return (
    <div className="relative w-[min(320px,86vw)]">
      <div className="glass rounded-full flex items-center gap-2 px-3 py-2">
        <Search size={15} className="text-slate-400 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={(e) => e.key === 'Enter' && results[0] && pick(results[0])}
          placeholder="Search a city…"
          className="bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500 w-full"
          aria-label="Search for a place"
        />
        {q && (
          <button
            onClick={() => {
              setQ('');
              setResults([]);
            }}
            aria-label="Clear search"
            className="text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute mt-1.5 w-full glass rounded-xl overflow-hidden z-20">
          {loading && <div className="px-3 py-2 text-xs text-slate-400">Searching…</div>}
          {results.map((r, i) => (
            <button
              key={`${r.latitude},${r.longitude},${i}`}
              onClick={() => pick(r)}
              className="w-full text-left px-3 py-2 hover:bg-white/10 transition"
            >
              <div className="text-sm text-slate-100">{r.name}</div>
              <div className="text-[11px] text-slate-400">
                {[r.admin1, r.country].filter(Boolean).join(', ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
