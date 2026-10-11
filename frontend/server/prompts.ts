// Gemini prompt templates for the ClimateTransit resilience brief.
// These are NOT routed as a function; api/summary.ts imports them.

export interface PlanItem {
  title: string;
  action: string;
  horizon: string;
}

export interface Risk {
  type: string;
  level: string;
  detail: string;
}

export interface SummaryPayload {
  zone_now: string;
  zone_future: string;
  period: string;
  scenario: string;
  place: string;
  plan_items: PlanItem[];
  audience?: string;
  twin?: { place: string; strength: string } | null;
  risks: Risk[];
  forecast_brief: string;
  language?: string;
}

export const SYSTEM_PROMPT = `You are a climate-resilience assistant for the ClimateTransit app.
Rules you MUST follow:
- Use ONLY the facts and plan items provided in the payload. Do not invent actions, numbers, or places.
- Never make medical, health, or disease-causation claims.
- Never guarantee an outcome. Say "helps reduce" or "helps prevent".
- Plain, calm, hopeful, action-oriented language. No doom framing.
- The similar-future-climate ("twin") place gets at most one short clause and is never the headline.
- Hard limit: 100 words.
Structure: (1) what is changing here, (2) what to watch, (3) 2-3 concrete actions drawn from the provided plan items.`;

export function buildUserPrompt(p: SummaryPayload): string {
  const lang = p.language && p.language !== 'en' ? `\nRespond in language code: ${p.language}.` : '';
  const plan = p.plan_items
    .map((i) => `- [${i.horizon}] ${i.title}: ${i.action}`)
    .join('\n');
  const risks = p.risks.map((r) => `- ${r.type} (${r.level}): ${r.detail}`).join('\n');
  const twin = p.twin ? `\nTwin (supporting reference only): ${p.twin.place} — match ${p.twin.strength}.` : '';
  return `Place: ${p.place}
Zone now: ${p.zone_now} -> Zone by ${p.period} (${p.scenario}): ${p.zone_future}
Audience: ${p.audience ?? 'general'}
Forecast: ${p.forecast_brief}
Risks:\n${risks}
Available plan items (use only these for actions):\n${plan}${twin}${lang}`;
}

// Deterministic fallback used when Gemini is unavailable or times out.
export function templateFallback(p: SummaryPayload): string {
  const changing =
    p.zone_now === p.zone_future
      ? `${p.place} stays in climate zone ${p.zone_now} through ${p.period}.`
      : `${p.place} is shifting from zone ${p.zone_now} toward ${p.zone_future} by ${p.period} (${p.scenario}; projection, not prediction).`;
  const top = p.plan_items.slice(0, 3).map((i) => `${i.title} (${i.horizon})`);
  const actions = top.length
    ? ` Actions that help reduce risk: ${top.join('; ')}.`
    : '';
  const watch = p.risks.length
    ? ` Watch: ${p.risks.map((r) => `${r.type} ${r.level}`).join(', ')}.`
    : '';
  return `${changing}${watch}${actions} Confirm actions with local experts.`;
}
