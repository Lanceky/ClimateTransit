import { useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import { useStore } from '../state/store';
import { buildGlobeTexture, buildStarfield } from '../lib/textures';
import { fetchCountries, type CountryFeature } from '../lib/borders';

const AUTO_ROTATE_SPEED = 0.4;
const RESUME_IDLE_MS = 4000;

const BORDER_IDLE = 'rgba(226,240,255,0.22)';
const BORDER_HOVER = 'rgba(45,226,230,0.95)';
const CAP_HOVER = 'rgba(45,226,230,0.16)';
const CAP_IDLE = 'rgba(0,0,0,0)';

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

export function GlobeView() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const idleTimer = useRef<number | null>(null);
  const { w, h } = useWindowSize();

  const manifest = useStore((s) => s.manifest);
  const legend = useStore((s) => s.legend);
  const grids = useStore((s) => s.grids);
  const periodId = useStore((s) => s.periodId);
  const selected = useStore((s) => s.selected);
  const selectPoint = useStore((s) => s.selectPoint);

  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [hover, setHover] = useState<CountryFeature | null>(null);

  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch(() => setCountries([]));
  }, []);

  const texture = useMemo(() => {
    if (!manifest || !legend) return undefined;
    const grid = grids[periodId];
    if (!grid) return undefined;
    return buildGlobeTexture(grid, manifest.grid, legend);
  }, [manifest, legend, grids, periodId]);

  const starfield = useMemo(() => buildStarfield(), []);

  // Apply zoom limits once the globe's OrbitControls exist.
  useEffect(() => {
    const controls = globeRef.current?.controls?.() as
      | { minDistance: number; maxDistance: number }
      | undefined;
    if (!controls) return;
    controls.minDistance = 150;
    controls.maxDistance = 600;
  }, [texture]);

  // Fly the camera to a freshly selected point.
  useEffect(() => {
    if (!selected) return;
    globeRef.current?.pointOfView(
      { lat: selected.lat, lng: selected.lng, altitude: 1.6 },
      900,
    );
  }, [selected]);

  // Auto-rotate management: on when idle & nothing selected; respects reduced motion.
  const setAutoRotate = (on: boolean) => {
    const controls = globeRef.current?.controls?.() as
      | { autoRotate: boolean; autoRotateSpeed: number }
      | undefined;
    if (!controls) return;
    controls.autoRotate = on && !reducedMotion && !selected;
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
  };

  useEffect(() => {
    setAutoRotate(!selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, reducedMotion, texture]);

  const nudgeIdle = () => {
    setAutoRotate(false);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setAutoRotate(true), RESUME_IDLE_MS);
  };

  const ringsData = selected
    ? [{ lat: selected.lat, lng: selected.lng }]
    : [];

  return (
    <div
      onPointerDown={nudgeIdle}
      onWheel={nudgeIdle}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Globe
        ref={globeRef}
        width={w}
        height={h}
        globeImageUrl={texture}
        backgroundImageUrl={starfield}
        backgroundColor="#070b1a"
        showAtmosphere
        atmosphereColor="#38f0e8"
        atmosphereAltitude={0.2}
        onGlobeClick={({ lat, lng }) => selectPoint({ lat, lng })}
        polygonsData={countries}
        polygonAltitude={(d) => (d === hover ? 0.02 : 0.006)}
        polygonCapColor={(d) => (d === hover ? CAP_HOVER : CAP_IDLE)}
        polygonSideColor={() => 'rgba(0,0,0,0)'}
        polygonStrokeColor={(d) => (d === hover ? BORDER_HOVER : BORDER_IDLE)}
        polygonLabel={(d) => {
          const name = (d as CountryFeature).properties?.name ?? '';
          return `<div style="background:rgba(7,11,26,0.9);color:#e2e8f0;padding:3px 9px;border-radius:9px;font-size:12px;font-weight:600;border:1px solid rgba(45,226,230,0.35);white-space:nowrap">${name}</div>`;
        }}
        polygonsTransitionDuration={200}
        onPolygonHover={(d) => {
          setHover((d as CountryFeature) ?? null);
          if (d) nudgeIdle();
        }}
        onPolygonClick={(_d, _ev, coords) => {
          const c = coords as { lat: number; lng: number } | undefined;
          if (c) selectPoint({ lat: c.lat, lng: c.lng });
        }}
        ringsData={ringsData}
        ringColor={() => (t: number) => `rgba(255,46,154,${1 - t})`}
        ringMaxRadius={5}
        ringPropagationSpeed={3}
        ringRepeatPeriod={900}
        pointsData={selected ? [{ lat: selected.lat, lng: selected.lng }] : []}
        pointColor={() => '#ff2e9a'}
        pointAltitude={0.03}
        pointRadius={0.55}
      />
    </div>
  );
}
