import type { AttentionStatus, MissionStatus, Severity, ValidationStatus } from "../types/domain";

export const SEVERITY_LABEL: Record<Severity, string> = { baja: "Baja", media: "Media", alta: "Alta" };
// Estos colores se reservan para la severidad de los baches.
export const SEVERITY_COLOR: Record<Severity, string> = { baja: "#d8a31a", media: "#e4701e", alta: "#c23b30" };
export const SEVERITY_ORDER: Record<Severity, number> = { baja: 1, media: 2, alta: 3 };

export const ATTENTION_LABEL: Record<AttentionStatus, string> = {
  pendiente: "Pendiente",
  programado: "Programado para reparación",
  en_reparacion: "En reparación",
  atendido: "Atendido",
};

export const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  sin_revisar: "Detección automática, sin revisar",
  confirmado: "Confirmada por una persona",
  falso_positivo: "Descartada como falso positivo",
};

export const MISSION_STATUS_LABEL: Record<MissionStatus, string> = {
  borrador: "Borrador",
  planificada: "Planificada",
  en_ejecucion: "En ejecución",
  completada: "Completada",
  cancelada: "Cancelada",
  con_error: "Con error",
};

export const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";

export const fmtCoord = (lat: number, lon: number) => `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

export const fmtArea = (v: number | null, unit: string) => (v == null ? "—" : `${v.toFixed(2)} ${unit === "m2" ? "m²" : "cm²"}`);
