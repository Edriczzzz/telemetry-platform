import type { ServerState } from "../features/system/useHealth";

const LABELS: Record<ServerState, { text: string; cls: string }> = {
  online: { text: "Servidor conectado", cls: "bg-emerald-100 text-emerald-900" },
  degraded: { text: "Servidor con fallas parciales", cls: "bg-amber-100 text-amber-900" },
  offline: { text: "Sin conexión con el servidor", cls: "bg-red-100 text-red-900" },
  checking: { text: "Comprobando servidor…", cls: "bg-slate-200 text-slate-800" },
};

/** El estado se comunica con texto, no solo con color. */
export function ConnectionStatus({ state }: { state: ServerState }) {
  const { text, cls } = LABELS[state];
  return (
    <span role="status" className={`rounded px-2.5 py-1 text-sm font-bold ${cls}`}>
      {text}
    </span>
  );
}
