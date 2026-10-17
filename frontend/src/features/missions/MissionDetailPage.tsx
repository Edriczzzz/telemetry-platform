import { Link, useParams } from "react-router-dom";
import { DataState } from "../../components/DataState";
import { DetectionMap } from "../../components/DetectionMap";
import { AttentionTag, MissionStatusTag, SeverityTag } from "../../components/Tags";
import { useMission } from "../../hooks/useData";
import { fmtArea, fmtDateTime } from "../../lib/labels";
import type { Severity } from "../../types/domain";

export function MissionDetailPage() {
  const { id = "" } = useParams();
  const q = useMission(id);

  return (
    <section>
      <Link to="/missions" className="text-sm font-bold text-survey underline">← Volver a misiones</Link>
      <DataState isPending={q.isPending} error={q.error}>
        {q.data && (() => {
          const { mission: m, detections, track, events } = q.data;
          const editable = m.status === "borrador" || m.status === "planificada";
          return (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold">{m.name}</h1>
                <MissionStatusTag value={m.status} />
                {m.data_origin === "simulated" && <span className="text-sm">(datos de demostración)</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {editable && <Link to={`/missions/${m.id}/edit`} className="rounded bg-survey px-4 py-2 font-bold text-white">Editar</Link>}
                {m.started_at && <Link to={`/flight/${m.id}`} className="rounded border border-line bg-white px-4 py-2 font-bold">Ver en monitoreo</Link>}
                <Link to={`/map?mission=${m.id}`} className="rounded border border-line bg-white px-4 py-2 font-bold">Ver en el mapa</Link>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <dl className="grid grid-cols-[10rem_1fr] content-start gap-y-2 rounded border border-line bg-white p-4">
                  <dt className="font-bold">Zona</dt><dd>{m.zone}</dd>
                  <dt className="font-bold">Descripción</dt><dd>{m.description || "—"}</dd>
                  <dt className="font-bold">Creada</dt><dd>{fmtDateTime(m.created_at)}</dd>
                  <dt className="font-bold">Inicio</dt><dd>{fmtDateTime(m.started_at)}</dd>
                  <dt className="font-bold">Fin</dt><dd>{fmtDateTime(m.ended_at)}</dd>
                  <dt className="font-bold">Altitud planificada</dt><dd>{m.planned_altitude_m == null ? "—" : `${m.planned_altitude_m} m`}</dd>
                  <dt className="font-bold">Waypoints</dt><dd>{m.waypoints.length}</dd>
                  <dt className="font-bold">Resumen</dt>
                  <dd>
                    {m.detections_count === 0 ? "Sin detecciones registradas." : (
                      <span className="flex flex-wrap items-center gap-2">
                        {m.detections_count} baches, {m.attended_count} atendidos
                        {(["alta", "media", "baja"] as Severity[]).filter((s) => m.severity_counts[s] > 0).map((s) => (
                          <span key={s} className="inline-flex items-center gap-1"><SeverityTag value={s} />× {m.severity_counts[s]}</span>
                        ))}
                      </span>
                    )}
                  </dd>
                </dl>
                <DetectionMap detections={detections} track={track} areas={[m.area]} waypoints={m.waypoints} className="h-80" />
              </div>

              <div className="mt-4 rounded border border-line bg-white p-4">
                <h2 className="font-bold">Detecciones de la misión</h2>
                {detections.length === 0 ? <p className="mt-1">Esta misión no tiene detecciones.</p> : (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead><tr><th className="px-2 py-1">ID</th><th className="px-2 py-1">Severidad</th><th className="px-2 py-1">Área</th><th className="px-2 py-1">Atención</th></tr></thead>
                      <tbody>
                        {detections.slice(0, 10).map((d) => (
                          <tr key={d.id} className="border-t border-line">
                            <td className="px-2 py-1"><Link className="font-mono font-bold text-survey underline" to={`/detections/${d.id}`}>{d.id}</Link></td>
                            <td className="px-2 py-1"><SeverityTag value={d.severity} /></td>
                            <td className="px-2 py-1">{fmtArea(d.area_value, d.area_unit)}</td>
                            <td className="px-2 py-1"><AttentionTag value={d.attention_status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {detections.length > 10 && (
                      <p className="mt-2 text-sm">Se muestran 10 de {detections.length}. <Link className="font-bold text-survey underline" to={`/detections?mission=${m.id}`}>Ver todas en el inventario</Link></p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded border border-line bg-white p-4">
                <h2 className="font-bold">Historial de la misión</h2>
                <ol className="mt-2 space-y-2">
                  {events.map((e) => (
                    <li key={e.id} className="border-l-4 border-line pl-3">
                      <p>{e.text}</p>
                      <p className="text-sm">{fmtDateTime(e.at)} · {e.user_name ?? "Sistema"}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          );
        })()}
      </DataState>
    </section>
  );
}
