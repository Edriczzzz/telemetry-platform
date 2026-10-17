import type { DetectionRow, Mission, MissionInput, Summary } from "../../types/domain";
import type { DataSource } from "../types";
import { buildDemoDataset, withStats } from "./demoData";
import { queryDetections } from "./queryDetections";
import { queryMissions } from "./queryMissions";

const delay = () => new Promise((r) => setTimeout(r, 120)); // simula latencia de red
const EDITABLE = ["borrador", "planificada"];

/** Reglas que el backend aplicará de verdad (Fase 4); aquí se replican para que la demo se comporte igual. */
function validateInput(i: MissionInput) {
  if (i.name.trim().length < 3) throw new Error("El nombre debe tener al menos 3 caracteres");
  if (i.status === "planificada") {
    if (i.area.length < 3) throw new Error("Para planificar una misión dibuja una zona de al menos 3 vértices");
    if (i.waypoints.length < 2) throw new Error("Para planificar una misión define al menos 2 waypoints");
    if (i.planned_altitude_m == null) throw new Error("Para planificar una misión indica la altitud");
  }
}

export function createDemoSource(): DataSource {
  const data = buildDemoDataset();
  let seq = data.missions.length;
  let eid = 1000;
  const nameOf = (id: string) => data.missions.find((m) => m.id === id)?.name ?? "—";
  const rows = (): DetectionRow[] => data.detections.map((d) => ({ ...d, mission_name: nameOf(d.mission_id) }));
  const find = (id: string) => {
    const m = data.missions.find((x) => x.id === id);
    if (!m) throw new Error("No se encontró la misión solicitada");
    return m;
  };

  return {
    name: "demo",
    async listMissions(q) {
      await delay();
      return queryMissions(data.missions, q);
    },
    async getMission(id) {
      await delay();
      const mission = find(id);
      return {
        mission,
        detections: rows().filter((d) => d.mission_id === id),
        track: data.tracks[id] ?? [],
        events: data.events[id] ?? [],
      };
    },
    async createMission(input) {
      await delay();
      validateInput(input);
      const now = new Date().toISOString();
      const id = `demo-m${++seq}`;
      const mission: Mission = withStats(
        {
          id, name: input.name.trim(), description: input.description, zone: input.zone.trim(), status: input.status,
          planned_altitude_m: input.planned_altitude_m, area: input.area, waypoints: input.waypoints,
          created_at: now, started_at: null, ended_at: null,
          detections_count: 0, severity_counts: { baja: 0, media: 0, alta: 0 }, attended_count: 0,
          data_origin: "simulated",
        },
        data.detections,
      );
      data.missions.push(mission);
      data.tracks[id] = [];
      data.telemetry[id] = [];
      data.events[id] = [{ id: ++eid, at: now, text: "Misión creada", user_name: "Usuario (demo)" }];
      return mission;
    },
    async updateMission(id, input) {
      await delay();
      const current = find(id);
      if (!EDITABLE.includes(current.status)) {
        throw new Error("Solo se pueden editar misiones en borrador o planificadas");
      }
      validateInput(input);
      const updated: Mission = {
        ...current, name: input.name.trim(), description: input.description, zone: input.zone.trim(),
        status: input.status, planned_altitude_m: input.planned_altitude_m, area: input.area, waypoints: input.waypoints,
      };
      data.missions[data.missions.indexOf(current)] = updated;
      const text = input.status !== current.status ? `Estado cambiado a «${input.status}»` : "Misión modificada";
      data.events[id] = [...(data.events[id] ?? []), { id: ++eid, at: new Date().toISOString(), text, user_name: "Usuario (demo)" }];
      return updated;
    },
    async listDetections(q) {
      await delay();
      return queryDetections(rows(), q);
    },
    async getDetection(id) {
      await delay();
      const detection = rows().find((d) => d.id === id);
      if (!detection) throw new Error("No se encontró el bache solicitado");
      return { detection, mission: find(detection.mission_id), history: data.history[id] ?? [] };
    },
    async getTrack(missionId) {
      await delay();
      return data.tracks[missionId] ?? [];
    },
    async getTelemetry(missionId) {
      await delay();
      return data.telemetry[missionId] ?? [];
    },
    async getSummary(): Promise<Summary> {
      await delay();
      const real = data.detections.filter((d) => d.validation_status !== "falso_positivo");
      const ended = data.missions.filter((m) => m.status === "completada" && m.ended_at).map((m) => m.ended_at!);
      return {
        missions_total: data.missions.length,
        missions_completed: data.missions.filter((m) => m.status === "completada").length,
        missions_running: data.missions.filter((m) => m.status === "en_ejecucion").length,
        detections_total: data.detections.length,
        detections_pending: real.filter((d) => d.attention_status !== "atendido").length,
        detections_attended: real.filter((d) => d.attention_status === "atendido").length,
        last_inspection_at: ended.sort().at(-1) ?? null,
      };
    },
  };
}
