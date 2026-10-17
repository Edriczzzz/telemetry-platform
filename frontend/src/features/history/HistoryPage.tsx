import { useState } from "react";
import { Link } from "react-router-dom";
import { DataState } from "../../components/DataState";
import { MissionStatusTag, SeverityTag } from "../../components/Tags";
import { useMissions } from "../../hooks/useData";
import { fmtDateTime, SEVERITY_LABEL } from "../../lib/labels";
import type { MissionQuery } from "../../services/types";
import type { Severity } from "../../types/domain";

const field = "mt-1 block w-full rounded border border-line bg-white px-2 py-1.5";

export function HistoryPage() {
  const [f, setF] = useState<MissionQuery>({ onlyExecuted: true });
  const all = useMissions({ onlyExecuted: true });
  const q = useMissions(f);
  const zones = [...new Set(all.data?.map((m) => m.zone) ?? [])].sort();
  const patch = (p: Partial<MissionQuery>) => setF((s) => ({ ...s, ...p }));
  const totalDet = q.data?.reduce((s, m) => s + m.detections_count, 0) ?? 0;

  return (
    <section>
      <h1 className="text-2xl font-bold">Historial de inspecciones</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded border border-line bg-white p-4 md:grid-cols-4">
        <label className="text-sm font-bold">Desde
          <input type="date" className={field} value={f.from ?? ""} onChange={(e) => patch({ from: e.target.value })} />
        </label>
        <label className="text-sm font-bold">Hasta
          <input type="date" className={field} value={f.to ?? ""} onChange={(e) => patch({ to: e.target.value })} />
        </label>
        <label className="text-sm font-bold">Zona
          <select className={field} value={f.zone ?? ""} onChange={(e) => patch({ zone: e.target.value })}>
            <option value="">Todas</option>
            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">Severidad (con al menos un bache de)
          <select className={field} value={f.severity ?? ""} onChange={(e) => patch({ severity: e.target.value as MissionQuery["severity"] })}>
            <option value="">Cualquiera</option>
            {Object.entries(SEVERITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <DataState isPending={q.isPending} error={q.error} isEmpty={q.data?.length === 0} emptyMessage="Ninguna inspección coincide con los filtros.">
          <p role="status" className="mb-2 text-sm">Inspecciones encontradas: {q.data?.length} · Baches detectados: {totalDet}</p>
          <div className="overflow-x-auto rounded border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper">
                <tr>{["Misión", "Zona", "Fecha", "Estado", "Baches por severidad", "Ortomosaico", "Acciones"].map((h) => <th key={h} scope="col" className="whitespace-nowrap px-3 py-2">{h}</th>)}</tr>
              </thead>
              <tbody>
                {q.data?.map((m) => (
                  <tr key={m.id} className="border-t border-line">
                    <td className="px-3 py-2 font-bold">{m.name}</td>
                    <td className="px-3 py-2">{m.zone}</td>
                    <td className="whitespace-nowrap px-3 py-2">{fmtDateTime(m.started_at)}</td>
                    <td className="px-3 py-2"><MissionStatusTag value={m.status} /></td>
                    <td className="px-3 py-2">
                      {m.detections_count === 0 ? "Sin detecciones" : (
                        <span className="flex flex-wrap gap-2">
                          {(["alta", "media", "baja"] as Severity[]).filter((s) => m.severity_counts[s] > 0).map((s) => (
                            <span key={s} className="inline-flex items-center gap-1"><SeverityTag value={s} />× {m.severity_counts[s]}</span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">No disponible (Fase 6)</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <Link className="font-bold text-survey underline" to={`/missions/${m.id}`}>Detalle</Link>
                      {" · "}
                      <Link className="font-bold text-survey underline" to={`/map?mission=${m.id}`}>Mapa</Link>
                    </td>
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
