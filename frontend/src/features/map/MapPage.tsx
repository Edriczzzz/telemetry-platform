import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DataState } from "../../components/DataState";
import { DetectionFilters } from "../../components/DetectionFilters";
import { type Bbox, DetectionMap } from "../../components/DetectionMap";
import { useDetections, useMissions, useTrack } from "../../hooks/useData";
import type { DetectionQuery } from "../../services/types";

export function MapPage() {
  const [params] = useSearchParams();
  const [filters, setFilters] = useState<DetectionQuery>({ missionId: params.get("mission") ?? "" });
  const [onlyVisible, setOnlyVisible] = useState(false);
  const [bounds, setBounds] = useState<Bbox | null>(null);

  const missions = useMissions();
  const track = useTrack(filters.missionId ?? "");
  const result = useDetections({ ...filters, pageSize: 500, bbox: onlyVisible && bounds ? bounds : undefined });

  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Mapa geoespacial</h1>
      <div className="rounded border border-line bg-white p-4">
        <DetectionFilters value={filters} onChange={(p) => setFilters((f) => ({ ...f, ...p }))} missions={missions.data ?? []} />
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2 font-bold">
            <input type="checkbox" checked={onlyVisible} onChange={(e) => setOnlyVisible(e.target.checked)} />
            Limitar al área visible del mapa
          </label>
          <span role="status">{result.data ? `${result.data.total} baches en el mapa` : "Cargando…"}</span>
          {filters.missionId && <span>Se muestra la trayectoria de la misión seleccionada.</span>}
        </div>
      </div>

      <DataState isPending={result.isPending} error={result.error}>
        {result.data && (
          <DetectionMap
            detections={result.data.items}
            track={filters.missionId ? track.data : undefined}
            areas={(missions.data ?? []).filter((m) => !filters.missionId || m.id === filters.missionId).map((m) => m.area)}
            selectedId={params.get("detection")}
            onBoundsChange={setBounds}
            className="h-[62vh]"
          />
        )}
      </DataState>
      <p className="text-sm">Los ortomosaicos georreferenciados se podrán activar como capa desde aquí cuando se implemente la carga (Fase 6).</p>
    </section>
  );
}
