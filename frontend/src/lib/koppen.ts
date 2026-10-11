// koppen.ts — legend types + lookup helpers.

export interface KoppenClass {
  id: number;
  code: string;
  name: string;
  color: string;
  group: string;
  hazards: string[];
}

export interface Legend {
  classes: KoppenClass[];
  note: string;
}

const GROUP_NAMES: Record<string, string> = {
  A: 'Tropical',
  B: 'Arid',
  C: 'Temperate',
  D: 'Continental',
  E: 'Polar',
};

export function buildClassMap(legend: Legend): Map<number, KoppenClass> {
  return new Map(legend.classes.map((c) => [c.id, c]));
}

export function groupName(group: string): string {
  return GROUP_NAMES[group] ?? group;
}

/** Color array indexed by class id (0 = ocean). Used by the texture builder. */
export function colorLookup(legend: Legend): string[] {
  const maxId = Math.max(...legend.classes.map((c) => c.id));
  const arr = new Array<string>(maxId + 1).fill('#0a1326'); // ocean / no-data
  for (const c of legend.classes) arr[c.id] = c.color;
  return arr;
}
