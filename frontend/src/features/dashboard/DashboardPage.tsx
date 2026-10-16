import { ConnectionStatus } from "../../components/ConnectionStatus";
import { DataState } from "../../components/DataState";
import { DetectionMap } from "../../components/DetectionMap";
import { MissionStatusTag } from "../../components/Tags";
import { useDetections, useMissions, useSummary } from "../../hooks/useData";
import { DEMO_MODE } from "../../lib/config";
import { fmtDateTime } from "../../lib/labels";
import { useHealth } from "../system/useHealth";

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-line bg-white px-3 py-2">
      <dt className="text-sm">{label}</dt>
      <dd className="mt-0.5 text-xl font-bold">{children}</dd>
    </div>
  );
}

export function DashboardPage() {
  const summary = useSummary();
  const missions = useMissions();
  const recent = useDetections({ sortBy: "detected_at", sortDir: "desc", pageSize: 10 });
  const { state } = useHealth();
  const s = summary.data;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Panel</h1>
      {DEMO_MODE && <p className="text-sm">Los indicadores se calculan sobre datos de demostración, no sobre vuelos reales.</p>}

      <DataState isPending={summary.isPending} error={summary.error}>
        {s && (
          <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Tile label="Total de misiones">{s.missions_total}</Tile>
            <Tile label="Misiones completadas">{s.missions_completed}</Tile>
            <Tile label="Misiones en ejecución">{s.missions_running}</Tile>
            <Tile label="Baches detectados">{s.detections_total}</Tile>
            <Tile label="Pendientes de atención">{s.detections_pending}</Tile>
            <Tile label="Atendidos">{s.detections_attended}</Tile>
            <Tile label="Última inspección"><span className="text-base">{fmtDateTime(s.last_inspection_at)}</span></Tile>
            <Tile label="Conexión con el servidor"><ConnectionStatus state={state} /></Tile>
          </dl>
        )}
      </DataState>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="mb-2 font-bold">Detecciones recientes</h2>
          <DataState isPending={recent.isPending} error={recent.error} isEmpty={recent.data?.total === 0} emptyMessage="Aún no hay detecciones registradas.">
            {recent.data && <DetectionMap detections={recent.data.items} areas={(missions.data ?? []).map((m) => m.area)} className="h-96" />}
          </DataState>
        </div>
        <div>
          <h2 className="mb-2 font-bold">Misiones</h2>
          <DataState isPending={missions.isPending} error={missions.error} isEmpty={missions.data?.length === 0} emptyMessage="Todavía no hay misiones.">
            <ul className="divide-y divide-line rounded border border-line bg-white">
              {missions.data?.map((m) => (
                <li key={m.id} className="px-3 py-2">
                  <p className="font-bold">{m.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <MissionStatusTag value={m.status} />
                    <span>{m.detections_count} detecciones</span>
                    <span>{fmtDateTime(m.ended_at ?? m.created_at)}</span>
                  </p>
                </li>
              ))}
            </ul>
          </DataState>
        </div>
      </div>
    </section>
  );
}
