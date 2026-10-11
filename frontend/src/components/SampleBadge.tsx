import { FlaskConical } from 'lucide-react';
import { useStore } from '../state/store';

export function SampleBadge() {
  const manifest = useStore((s) => s.manifest);
  if (!manifest?.dataSource?.startsWith('PLACEHOLDER')) return null;
  return (
    <div
      className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5 text-amber-300"
      title={manifest.note}
    >
      <FlaskConical size={13} />
      <span className="text-[11px] font-semibold uppercase tracking-wide">
        Sample data
      </span>
    </div>
  );
}
