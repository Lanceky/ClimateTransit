import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { buildPayload, fetchSummary, type SummaryResult } from '../lib/summary';
import type { PlanItem } from '../lib/plans';
import type { Risk } from '../lib/risk';

export function GeminiBrief({
  place,
  zoneNow,
  zoneFuture,
  period,
  scenario,
  plans,
  risks,
  forecastBrief,
}: {
  place: string;
  zoneNow: string;
  zoneFuture: string;
  period: string;
  scenario: string;
  plans: PlanItem[];
  risks: Risk[];
  forecastBrief: string;
}) {
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const payload = buildPayload({
      place,
      zoneNow,
      zoneFuture,
      period,
      scenario,
      audience: 'general',
      plans,
      risks,
      forecastBrief,
    });
    setResult(await fetchSummary(payload));
    setLoading(false);
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-3 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
          <Sparkles size={14} className="text-cyan-300" />
          AI resilience brief
        </div>
        <button
          onClick={run}
          disabled={loading || !plans.length}
          className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-400 text-slate-900 font-medium disabled:opacity-50"
        >
          {loading ? 'Writing…' : result ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {result ? (
        <>
          <p className="text-xs text-slate-200 leading-relaxed mt-2">{result.text}</p>
          <div className="text-[10px] text-slate-400 mt-1.5">
            {result.model === 'template'
              ? 'Template fallback (facts only — Gemini unavailable).'
              : `Gemini (${result.model})${result.cached ? ' · cached' : ''} · rephrases facts only, invents nothing.`}
          </div>
        </>
      ) : (
        <p className="text-[11px] text-slate-400 mt-2">
          Generates a ≤100-word brief from the facts and plan above. Gemini may
          rephrase but never invents actions; a template fallback runs if it is
          unavailable.
        </p>
      )}
    </div>
  );
}
