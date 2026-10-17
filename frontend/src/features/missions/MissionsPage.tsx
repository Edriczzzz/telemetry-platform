import { useState } from "react";
import { Link } from "react-router-dom";
import { DataState } from "../../components/DataState";
import { MissionStatusTag } from "../../components/Tags";
import { useMissions } from "../../hooks/useData";
import { fmtDateTime, MISSION_STATUS_LABEL } from "../../lib/labels";
import type { MissionStatus } from "../../types/domain";

export function MissionsPage() {
  const [status, setStatus] = useState<MissionStatus | "">("");
  const q = useMissions({ status });

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Misiones</h1>
        <Link to="/missions/new" className="rounded bg-survey px-4 py-2 font-bold text-white">Nueva misión</Link>
      </div>
      <label className="mt-4 block max-w-xs text-sm font-bold">
        Estado
        <select className="mt-1 block w-full rounded border border-line bg-white px-2 py-1.5" value={status} onChange={(e) => setStatus(e.target.value as MissionStatus | "")}>
          <option value="">Todos</option>
          {Object.entries(MISSION_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <div className="mt-4">
        <DataState isPending={q.isPending} error={q.error} isEmpty={q.data?.length === 0} emptyMessage="No hay misiones con ese estado.">
          <div className="overflow-x-auto rounded border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper">
                <tr>
                  {["Nombre", "Zona", "Estado", "Creada", "Inicio", "Fin", "Detecciones"].map((h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {q.data?.map((m) => (
                  <tr key={m.id} className="border-t border-line">
                    <td className="px-3 py-2"><Link className="font-bold text-survey underline" to={`/missions/${m.id}`}>{m.name}</Link></td>
                    <td className="px-3 py-2">{m.zone}</td>
                    <td className="px-3 py-2"><MissionStatusTag value={m.status} /></td>
                    <td className="whitespace-nowrap px-3 py-2">{fmtDateTime(m.created_at)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{fmtDateTime(m.started_at)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{fmtDateTime(m.ended_at)}</td>
                    <td className="px-3 py-2">{m.detections_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </div>
    </section>
  );
}
