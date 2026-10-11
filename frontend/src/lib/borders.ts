// borders.ts — load the bundled world-atlas countries TopoJSON and convert
// it to GeoJSON polygon features for the globe's border overlay.

import { feature } from 'topojson-client';
import type { Feature, Geometry } from 'geojson';
import type { Topology } from 'topojson-specification';

export interface CountryFeature extends Feature<Geometry> {
  properties: { name?: string };
}

let cache: CountryFeature[] | null = null;

export async function fetchCountries(): Promise<CountryFeature[]> {
  if (cache) return cache;
  const res = await fetch('/data/countries-110m.json');
  if (!res.ok) throw new Error(`Failed to load borders: ${res.status}`);
  const topo = (await res.json()) as Topology;
  const fc = feature(topo, topo.objects.countries) as unknown as {
    features: CountryFeature[];
  };
  cache = fc.features;
  return cache;
}
