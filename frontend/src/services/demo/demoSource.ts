import type { DetectionRow, Summary } from "../../types/domain";
import type { DataSource } from "../types";
import { buildDemoDataset } from "./demoData";
import { queryDetections } from "./queryDetections";

const delay = () => new Promise((r) => setTimeout(r, 120)); // simula latencia de red

export function createDemoSource(): DataSource {
  const data = buildDemoDataset();
  const nameOf = (id: string) => data.missions.find((m) => m.id === id)?.name ?? "—";
  const rows = (): DetectionRow[] => data.detections.map((d) => ({ ...d, mission_name: nameOf(d.mission_id) }));

  return {
    name: "demo",
    async listMissions() {
      await delay();
      return data.missions;
    },
    async listDetections(q) {
      await delay();
      return queryDetections(rows(), q);
    },
    async getDetection(id) {
      await delay();
      const detection = rows().find((d) => d.id === id);
      if (!detection) throw new Error("No se encontró el bache solicitado");
      const mission = data.missions.find((m) => m.id === detection.mission_id)!;
      return { detection, mission, history: data.history[id] ?? [] };
    },
    async getTrack(missionId) {
      await delay();
      return data.tracks[missionId] ?? [];
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
