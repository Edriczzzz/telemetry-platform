import { NotAvailableError } from "../errors";
import type { DataSource } from "../types";

const nope = (): never => {
  throw new NotAvailableError("Los datos reales estarán disponibles cuando se implemente la API (Fase 4).");
};

/** Fuente real. Se implementará con apiFetch cuando existan los endpoints (Fase 4). */
export const liveSource: DataSource = {
  name: "live",
  listMissions: async () => nope(),
  getMission: async () => nope(),
  createMission: async () => nope(),
  updateMission: async () => nope(),
  getTelemetry: async () => nope(),
  listDetections: async () => nope(),
  getDetection: async () => nope(),
  getTrack: async () => nope(),
  getSummary: async () => nope(),
};
