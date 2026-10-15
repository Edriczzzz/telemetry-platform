import { ConnectionStatus } from "../../components/ConnectionStatus";
import { useHealth } from "./useHealth";

export function SystemPage() {
  const { state, data, checkedAt } = useHealth();
  return (
    <section className="max-w-2xl">
      <h1 className="text-2xl font-bold">Estado del sistema</h1>
      <dl className="mt-4 grid grid-cols-[12rem_1fr] gap-y-2 rounded border border-line bg-white p-4">
        <dt className="font-bold">Backend</dt>
        <dd><ConnectionStatus state={state} /></dd>
        <dt className="font-bold">Base de datos</dt>
        <dd>{data ? (data.database === "ok" ? "Disponible" : "No disponible") : "Sin datos"}</dd>
        <dt className="font-bold">Entorno</dt>
        <dd className="font-mono">{data?.environment ?? "—"}</dd>
        <dt className="font-bold">Última comprobación</dt>
        <dd className="font-mono">{checkedAt ? new Date(checkedAt).toLocaleTimeString("es-MX") : "—"}</dd>
        <dt className="font-bold">WebSocket</dt>
        <dd>No implementado (Fase 5)</dd>
        <dt className="font-bold">Telemetría y detecciones</dt>
        <dd>Sin recepciones registradas (Fase 5)</dd>
      </dl>
    </section>
  );
}
