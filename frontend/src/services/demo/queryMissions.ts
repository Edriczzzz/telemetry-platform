import type { Mission } from "../../types/domain";
import type { MissionQuery } from "../types";

const dayOf = (m: Mission) => (m.started_at ?? m.created_at).slice(0, 10);

export function queryMissions(all: Mission[], q: MissionQuery = {}): Mission[] {
  return all
    .filter((m) => {
      if (q.status && m.status !== q.status) return false;
      if (q.zone && m.zone !== q.zone) return false;
      if (q.onlyExecuted && !m.started_at) return false;
      if (q.severity && m.severity_counts[q.severity] === 0) return false;
      if (q.from && dayOf(m) < q.from) return false;
      if (q.to && dayOf(m) > q.to) return false;
      return true;
    })
    .sort((a, b) => (b.started_at ?? b.created_at).localeCompare(a.started_at ?? a.created_at));
}
