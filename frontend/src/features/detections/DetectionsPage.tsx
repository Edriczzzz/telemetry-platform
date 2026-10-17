import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AttentionTag, SeverityTag } from "../../components/Tags";
import { DataState } from "../../components/DataState";
import { DetectionFilters } from "../../components/DetectionFilters";
import { useDetections, useMissions } from "../../hooks/useData";
import { fmtArea, fmtCoord, fmtDateTime } from "../../lib/labels";
import type { DetectionQuery, SortField } from "../../services/types";

const COLUMNS: { key: SortField | null; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "detected_at", label: "Fecha de detección" },
  { key: null, label: "Ubicación" },
  { key: "severity", label: "Severidad" },
  { key: "area_value", label: "Área estimada" },
  { key: "mission_name", label: "Misión" },
  { key: "attention_status", label: "Estado de atención" },
  { key: null, label: "Acciones" },
];

export function DetectionsPage() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState<DetectionQuery>({
    sortBy: "detected_at", sortDir: "desc", page: 1, pageSize: 10, missionId: params.get("mission") ?? "",
  });
  const missions = useMissions();
  const result = useDetections(query);
  const patch = (p: Partial<DetectionQuery>) => setQuery((q) => ({ ...q, ...p, page: 1 }));
  const sort = (key: SortField) =>
    setQuery((q) => ({ ...q, sortBy: key, sortDir: q.sortBy === key && q.sortDir === "asc" ? "desc" : "asc", page: 1 }));

  const data = result.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <section>
      <h1 className="text-2xl font-bold">Inventario de baches</h1>
      <div className="mt-4 rounded border border-line bg-white p-4">
        <DetectionFilters value={query} onChange={patch} missions={missions.data ?? []} showSearch />
      </div>

      <div className="mt-4">
        <DataState isPending={result.isPending} error={result.error} isEmpty={data?.total === 0} emptyMessage="Ningún bache coincide con los filtros.">
          {data && (
            <>
              <div className="overflow-x-auto rounded border border-line bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-paper">
                    <tr>
                      {COLUMNS.map((c) => (
                        <th
                          key={c.label}
                          scope="col"
                          className="whitespace-nowrap px-3 py-2"
                          aria-sort={c.key && query.sortBy === c.key ? (query.sortDir === "asc" ? "ascending" : "descending") : undefined}
                        >
                          {c.key ? (
                            <button className="font-bold underline-offset-2 hover:underline" onClick={() => sort(c.key!)}>
                              {c.label}
                              {query.sortBy === c.key && (query.sortDir === "asc" ? " ▲" : " ▼")}
                            </button>
                          ) : (
                            c.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((d) => (
                      <tr key={d.id} className="border-t border-line">
                        <td className="px-3 py-2 font-mono">{d.id}</td>
                        <td className="whitespace-nowrap px-3 py-2">{fmtDateTime(d.detected_at)}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono">{fmtCoord(d.latitude, d.longitude)}</td>
                        <td className="px-3 py-2"><SeverityTag value={d.severity} /></td>
                        <td className="whitespace-nowrap px-3 py-2">{fmtArea(d.area_value, d.area_unit)}</td>
                        <td className="px-3 py-2">{d.mission_name}</td>
                        <td className="px-3 py-2"><AttentionTag value={d.attention_status} /></td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <Link className="font-bold text-survey underline" to={`/detections/${d.id}`}>Detalle</Link>
                          {" · "}
                          <Link className="font-bold text-survey underline" to={`/map?detection=${d.id}`}>Ver en mapa</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>Página {data.page} de {pages} · {data.total} resultados</span>
                <span className="flex gap-2">
                  <button className="rounded border border-line bg-white px-3 py-1.5 disabled:opacity-50" disabled={data.page <= 1} onClick={() => setQuery((q) => ({ ...q, page: data.page - 1 }))}>Anterior</button>
                  <button className="rounded border border-line bg-white px-3 py-1.5 disabled:opacity-50" disabled={data.page >= pages} onClick={() => setQuery((q) => ({ ...q, page: data.page + 1 }))}>Siguiente</button>
                </span>
              </div>
            </>
          )}
        </DataState>
      </div>
    </section>
  );
}
