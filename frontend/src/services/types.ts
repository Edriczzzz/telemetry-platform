import type {
  AttentionStatus,
  DetectionHistoryEntry,
  DetectionRow,
  LatLng,
  Mission,
  MissionEvent,
  MissionInput,
  MissionStatus,
  Severity,
  Summary,
  TelemetryPoint,
} from "../types/domain";

export type SortField = "id" | "detected_at" | "severity" | "area_value" | "attention_status" | "mission_name";

export interface DetectionQuery {
  search?: string;
  severity?: Severity | "";
  attention?: AttentionStatus | "";
  missionId?: string;
  from?: string; // AAAA-MM-DD
  to?: string; // AAAA-MM-DD
  bbox?: [number, number, number, number]; // [sur, oeste, norte, este]
  sortBy?: SortField;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface MissionQuery {
  status?: MissionStatus | "";
  zone?: string;
  from?: string; // AAAA-MM-DD, sobre la fecha de inicio (o de creación si no se ha ejecutado)
  to?: string;
  severity?: Severity | ""; // misiones con al menos un bache de esa severidad
  onlyExecuted?: boolean; // solo misiones que ya iniciaron
}

export interface MissionDetail {
  mission: Mission;
  detections: DetectionRow[];
  track: LatLng[];
  events: MissionEvent[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Contrato que comparten la fuente de demostración y la fuente real (API, Fase 4). */
export interface DataSource {
  readonly name: "demo" | "live";
  listMissions(q?: MissionQuery): Promise<Mission[]>;
  getMission(id: string): Promise<MissionDetail>;
  createMission(input: MissionInput): Promise<Mission>;
  updateMission(id: string, input: MissionInput): Promise<Mission>;
  getTelemetry(missionId: string): Promise<TelemetryPoint[]>;
  listDetections(q: DetectionQuery): Promise<Page<DetectionRow>>;
  getDetection(id: string): Promise<{ detection: DetectionRow; mission: Mission; history: DetectionHistoryEntry[] }>;
  getTrack(missionId: string): Promise<LatLng[]>;
  getSummary(): Promise<Summary>;
}
