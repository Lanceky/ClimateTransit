// summary.ts — client call to the /api/summary Vercel function with a
// facts-only template fallback for local dev or server failure.

import type { PlanItem } from './plans';
import type { Risk } from './risk';

export interface SummaryPayload {
  zone_now: string;
  zone_future: string;
  period: string;
  scenario: string;
  place: string;
  plan_items: { title: string; action: string; horizon: string }[];
  audience?: string;
  risks: { type: string; level: string; detail: string }[];
  forecast_brief: string;
}

export interface SummaryResult {
  text: string;
  model: string;
  cached: boolean;
}

export function buildPayload(opts: {
  place: string;
  zoneNow: string;
  zoneFuture: string;
  period: string;
  scenario: string;
  audience: string;
  plans: PlanItem[];
  risks: Risk[];
  forecastBrief: string;
}): SummaryPayload {
  return {
    place: opts.place,
    zone_now: opts.zoneNow,
    zone_future: opts.zoneFuture,
    period: opts.period,
    scenario: opts.scenario,
    audience: opts.audience,
    plan_items: opts.plans.slice(0, 6).map((p) => ({
      title: p.title,
      action: p.action,
      horizon: p.horizon,
    })),
    risks: opts.risks
      .filter((r) => r.level !== 'Unknown')
      .map((r) => ({ type: r.type, level: r.level, detail: r.detail })),
    forecast_brief: opts.forecastBrief,
  };
}

/** Facts-only fallback — mirrors the server template, never invents actions. */
export function templateFallback(p: SummaryPayload): string {
  const changing =
    p.zone_now === p.zone_future
      ? `${p.place} stays in climate zone ${p.zone_now} through ${p.period}.`
      : `${p.place} is shifting from zone ${p.zone_now} toward ${p.zone_future} by ${p.period} (${p.scenario}; projection, not prediction).`;
  const top = p.plan_items.slice(0, 3).map((i) => `${i.title} (${i.horizon})`);
  const actions = top.length ? ` Actions that help reduce risk: ${top.join('; ')}.` : '';
  const watch = p.risks.length
    ? ` Watch: ${p.risks.map((r) => `${r.type} ${r.level}`).join(', ')}.`
    : '';
  return `${changing}${watch}${actions} Confirm actions with local experts.`;
}

export async function fetchSummary(payload: SummaryPayload): Promise<SummaryResult> {
  try {
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as SummaryResult;
    if (!data.text) throw new Error('empty');
    return data;
  } catch {
    return { text: templateFallback(payload), model: 'template', cached: false };
  }
}
