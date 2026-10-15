import { DEMO_MODE } from "../lib/config";

export function DemoBadge({ active = DEMO_MODE }: { active?: boolean }) {
  if (!active) return null;
  return (
    <span
      title="Los datos mostrados son de demostración y no provienen del VANT"
      className="rounded border border-demo bg-demo-bg px-2.5 py-1 text-sm font-bold text-demo"
    >
      Modo demostración
    </span>
  );
}
