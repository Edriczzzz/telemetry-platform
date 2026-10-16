import { SEVERITY_ORDER } from "../../lib/labels";
import type { DetectionRow } from "../../types/domain";
import type { DetectionQuery, Page } from "../types";

/** Filtra, ordena y pagina. Refleja lo que hará el backend con los mismos parámetros. */
export function queryDetections(all: DetectionRow[], q: DetectionQuery): Page<DetectionRow> {
  const term = q.search?.trim().toLowerCase();
  let rows = all.filter((d) => {
    if (q.severity && d.severity !== q.severity) return false;
    if (q.attention && d.attention_status !== q.attention) return false;
    if (q.missionId && d.mission_id !== q.missionId) return false;
    const day = d.detected_at.slice(0, 10);
    if (q.from && day < q.from) return false;
    if (q.to && day > q.to) return false;
    if (q.bbox) {
      const [s, w, n, e] = q.bbox;
      if (d.latitude < s || d.latitude > n || d.longitude < w || d.longitude > e) return false;
    }
    if (term && !`${d.id} ${d.frame_id ?? ""} ${d.mission_name}`.toLowerCase().includes(term)) return false;
    return true;
  });

  const dir = q.sortDir === "asc" ? 1 : -1;
  const by = q.sortBy ?? "detected_at";
  rows = [...rows].sort((a, b) => {
    let r: number;
    if (by === "severity") r = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    else if (by === "area_value") r = (a.area_value ?? -1) - (b.area_value ?? -1);
    else r = String(a[by]).localeCompare(String(b[by]));
    return r * dir || a.id.localeCompare(b.id);
  });

  const pageSize = Math.max(1, q.pageSize ?? 10);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(Math.max(1, q.page ?? 1), pages);
  return { items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize };
}
