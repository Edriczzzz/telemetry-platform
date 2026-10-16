import { ATTENTION_LABEL, MISSION_STATUS_LABEL, SEVERITY_COLOR, SEVERITY_LABEL, VALIDATION_LABEL } from "../lib/labels";
import type { AttentionStatus, MissionStatus, Severity, ValidationStatus } from "../types/domain";

const base = "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-sm";

export function SeverityTag({ value }: { value: Severity }) {
  return (
    <span className={`${base} border border-line bg-white`}>
      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_COLOR[value] }} />
      {SEVERITY_LABEL[value]}
    </span>
  );
}

const ATTENTION_CLS: Record<AttentionStatus, string> = {
  pendiente: "bg-slate-200 text-slate-900",
  programado: "bg-blue-100 text-blue-900",
  en_reparacion: "bg-amber-100 text-amber-900",
  atendido: "bg-emerald-100 text-emerald-900",
};
export function AttentionTag({ value }: { value: AttentionStatus }) {
  return <span className={`${base} ${ATTENTION_CLS[value]}`}>{ATTENTION_LABEL[value]}</span>;
}

const VALIDATION_CLS: Record<ValidationStatus, string> = {
  sin_revisar: "bg-slate-200 text-slate-900",
  confirmado: "bg-emerald-100 text-emerald-900",
  falso_positivo: "bg-red-100 text-red-900",
};
export function ValidationTag({ value }: { value: ValidationStatus }) {
  return <span className={`${base} ${VALIDATION_CLS[value]}`}>{VALIDATION_LABEL[value]}</span>;
}

const MISSION_CLS: Record<MissionStatus, string> = {
  borrador: "bg-slate-200 text-slate-900",
  planificada: "bg-blue-100 text-blue-900",
  en_ejecucion: "bg-teal-100 text-teal-900",
  completada: "bg-emerald-100 text-emerald-900",
  cancelada: "bg-slate-300 text-slate-900",
  con_error: "bg-red-100 text-red-900",
};
export function MissionStatusTag({ value }: { value: MissionStatus }) {
  return <span className={`${base} ${MISSION_CLS[value]}`}>{MISSION_STATUS_LABEL[value]}</span>;
}
