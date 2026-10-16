import { Link, useParams } from "react-router-dom";
import { DataState } from "../../components/DataState";
import { DetectionMap } from "../../components/DetectionMap";
import { AttentionTag, SeverityTag, ValidationTag } from "../../components/Tags";
import { useDetection } from "../../hooks/useData";
import { ATTENTION_LABEL, fmtArea, fmtCoord, fmtDateTime, VALIDATION_LABEL } from "../../lib/labels";

const LABELS: Record<string, string> = { ...ATTENTION_LABEL, ...VALIDATION_LABEL };

export function DetectionDetailPage() {
  const { id = "" } = useParams();
  const q = useDetection(id);

  return (
    <section>
      <Link to="/detections" className="text-sm font-bold text-survey underline">← Volver al inventario</Link>
      <DataState isPending={q.isPending} error={q.error}>
        {q.data && (() => {
          const { detection: d, mission, history } = q.data;
          return (
            <>
              <h1 className="mt-2 font-mono text-2xl font-bold">{d.id}</h1>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <dl className="grid grid-cols-[11rem_1fr] content-start gap-y-2 rounded border border-line bg-white p-4">
                  <dt className="font-bold">Ubicación</dt><dd className="font-mono">{fmtCoord(d.latitude, d.longitude)}</dd>
                  <dt className="font-bold">Detectado</dt><dd>{fmtDateTime(d.detected_at)}</dd>
                  <dt className="font-bold">Severidad</dt><dd><SeverityTag value={d.severity} /></dd>
                  <dt className="font-bold">Área estimada</dt><dd>{fmtArea(d.area_value, d.area_unit)}</dd>
                  <dt className="font-bold">Confianza del modelo</dt><dd>{d.confidence == null ? "—" : `${Math.round(d.confidence * 100)} %`}</dd>
                  <dt className="font-bold">Precisión GNSS</dt><dd>{d.gnss_accuracy_m == null ? "—" : `±${d.gnss_accuracy_m} m`}</dd>
                  <dt className="font-bold">Misión de origen</dt><dd>{mission.name}</dd>
                  <dt className="font-bold">Estado de atención</dt><dd><AttentionTag value={d.attention_status} /></dd>
                  <dt className="font-bold">Validación</dt><dd><ValidationTag value={d.validation_status} /></dd>
                  <dt className="font-bold">Origen del dato</dt>
                  <dd>{d.data_origin === "simulated" ? "Simulado (demostración)" : d.data_origin === "real" ? "Recibido del VANT" : "Histórico"}</dd>
                </dl>
                <DetectionMap detections={[d]} selectedId={d.id} className="h-80" />
              </div>

              <div className="mt-4 rounded border border-line bg-white p-4">
                <h2 className="font-bold">Evidencia fotográfica</h2>
                <p className="mt-1">
                  No disponible. Las fotografías no se transmiten durante el vuelo: se transfieren manualmente después de la misión.
                  {d.frame_id && <> Imagen de origen: <span className="font-mono">{d.frame_id}</span>.</>}
                </p>
              </div>

              <div className="mt-4 rounded border border-line bg-white p-4">
                <h2 className="font-bold">Historial de modificaciones</h2>
                {history.length === 0 ? (
                  <p className="mt-1">Sin cambios desde la detección automática.</p>
                ) : (
                  <ol className="mt-2 space-y-2">
                    {history.map((h) => (
                      <li key={h.id} className="border-l-4 border-line pl-3">
                        <p>
                          {h.field === "validation_status" ? "Validación" : "Atención"}:{" "}
                          {h.old_value ? LABELS[h.old_value] ?? h.old_value : "—"} → <strong>{LABELS[h.new_value] ?? h.new_value}</strong>
                        </p>
                        <p className="text-sm">{fmtDateTime(h.changed_at)} · {h.user_name ?? "Sistema"}{h.comment && ` · ${h.comment}`}</p>
                      </li>
                    ))}
                  </ol>
                )}
                <p className="mt-3 text-sm">Cambiar el estado desde esta pantalla se habilitará con la API (Fase 4).</p>
              </div>
            </>
          );
        })()}
      </DataState>
    </section>
  );
}
