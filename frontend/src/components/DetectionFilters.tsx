import { ATTENTION_LABEL, SEVERITY_LABEL } from "../lib/labels";
import type { DetectionQuery } from "../services/types";
import type { Mission } from "../types/domain";

interface Props {
  value: DetectionQuery;
  onChange: (patch: Partial<DetectionQuery>) => void;
  missions: Mission[];
  showSearch?: boolean;
}

const field = "mt-1 block w-full rounded border border-line bg-white px-2 py-1.5";

export function DetectionFilters({ value, onChange, missions, showSearch }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {showSearch && (
        <label className="col-span-2 text-sm font-bold">
          Buscar
          <input
            type="search"
            className={field}
            placeholder="ID, imagen o misión"
            value={value.search ?? ""}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </label>
      )}
      <label className="text-sm font-bold">
        Misión
        <select className={field} value={value.missionId ?? ""} onChange={(e) => onChange({ missionId: e.target.value })}>
          <option value="">Todas</option>
          {missions.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold">
        Severidad
        <select className={field} value={value.severity ?? ""} onChange={(e) => onChange({ severity: e.target.value as DetectionQuery["severity"] })}>
          <option value="">Todas</option>
          {Object.entries(SEVERITY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold">
        Estado de atención
        <select className={field} value={value.attention ?? ""} onChange={(e) => onChange({ attention: e.target.value as DetectionQuery["attention"] })}>
          <option value="">Todos</option>
          {Object.entries(ATTENTION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold">
        Desde
        <input type="date" className={field} value={value.from ?? ""} onChange={(e) => onChange({ from: e.target.value })} />
      </label>
      <label className="text-sm font-bold">
        Hasta
        <input type="date" className={field} value={value.to ?? ""} onChange={(e) => onChange({ to: e.target.value })} />
      </label>
    </div>
  );
}
