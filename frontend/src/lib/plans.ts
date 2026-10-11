// plans.ts — resilience-plan types, loader, and selection by Köppen group.

export type Horizon = 'now' | 'this season' | 'long term';
export type Audience = 'farmer' | 'household' | 'planner';

export interface PlanItem {
  id: string;
  hazard: string;
  title: string;
  why: string;
  action: string;
  audience: Audience;
  horizon: Horizon;
  earlyWarning: string;
  evidenceNote: string;
  sourceUrl: string;
  whereItWorks?: string;
}

export interface ResiliencePlans {
  note: string;
  fallback: PlanItem[];
  byGroup: Record<string, PlanItem[]>;
}

export const HORIZON_ORDER: Horizon[] = ['now', 'this season', 'long term'];

export async function fetchPlans(): Promise<ResiliencePlans> {
  const res = await fetch('/data/resilience_plans.json');
  if (!res.ok) throw new Error(`Failed to load resilience plans: ${res.status}`);
  return res.json() as Promise<ResiliencePlans>;
}

/** Plans for the governing group (future zone's group if it changed). */
export function selectPlans(
  plans: ResiliencePlans | null,
  group: string | undefined,
): PlanItem[] {
  if (!plans) return [];
  const g = (group ?? '').toUpperCase();
  const items = plans.byGroup[g];
  return items && items.length ? items : plans.fallback;
}

export function groupByHorizon(items: PlanItem[]): Record<Horizon, PlanItem[]> {
  const out: Record<Horizon, PlanItem[]> = {
    now: [],
    'this season': [],
    'long term': [],
  };
  for (const i of items) out[i.horizon]?.push(i);
  return out;
}
