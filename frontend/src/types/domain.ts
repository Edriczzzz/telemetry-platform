// Tipos de dominio. En la Fase 4 se reemplazarán por los generados desde OpenAPI (npm run gen:api).
export type LatLng = [number, number]; // [latitud, longitud]

export type Severity = "baja" | "media" | "alta";
export type AttentionStatus = "pendiente" | "programado" | "en_reparacion" | "atendido";
export type ValidationStatus = "sin_revisar" | "confirmado" | "falso_positivo";
export type DataOrigin = "real" | "simulated" | "historical";
export type MissionStatus = "borrador" | "planificada" | "en_ejecucion" | "completada" | "cancelada" | "con_error";

export interface Mission {
  id: string;
  name: string;
  description: string;
  status: MissionStatus;
  area: LatLng[]; // anillo del polígono de inspección
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  detections_count: number;
  data_origin: DataOrigin;
}

export interface Detection {
  id: string;
  mission_id: string;
  detected_at: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  area_value: number | null;
  area_unit: "m2" | "cm2";
  confidence: number | null;
  gnss_accuracy_m: number | null;
  frame_id: string | null;
  source: "model" | "manual";
  attention_status: AttentionStatus;
  validation_status: ValidationStatus;
  data_origin: DataOrigin;
}

export type DetectionRow = Detection & { mission_name: string };

export interface DetectionHistoryEntry {
  id: number;
  field: "attention_status" | "validation_status";
  old_value: string | null;
  new_value: string;
  user_name: string | null;
  changed_at: string;
  comment: string | null;
}

export interface Summary {
  missions_total: number;
  missions_completed: number;
  missions_running: number;
  detections_total: number;
  detections_pending: number;
  detections_attended: number;
  last_inspection_at: string | null;
}
