import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConnectionStatus } from "../../components/ConnectionStatus";
import { DataState } from "../../components/DataState";
import { DetectionMap } from "../../components/DetectionMap";
import { MissionStatusTag } from "../../components/Tags";
import { useMission, useMissions, useTelemetry } from "../../hooks/useData";
import { fmtDateTime } from "../../lib/labels";
import { classifyTelemetry, isStale, type TelemetryKind, useNow } from "../../lib/telemetry";
import { useHealth } from "../system/useHealth";

const BANNER: Record<TelemetryKind, { text: string; cls: string }> = {
  live: { text: "Telemetría recibida y confirmada", cls: "border-emerald-700 bg-emerald-50 text-emerald-900" },
  historical: { text: "Información histórica: la misión ya terminó", cls: "border-slate-500 bg-slate-100 text-slate-900" },
  simulated: { text: "DATOS SIMULADOS DE DEMOSTRACIÓN: no provienen del vehículo real", cls: "border-demo bg-demo-bg text-demo" },
};

export function FlightMonitorPage() {
  const { missionId } = useParams();
  return missionId ? <Monitor missionId={missionId} /> : <Chooser />;
}

function Chooser() {
  const q = useMissions();
  const running = q.data?.filter((m) => m.status === "en_ejecucion") ?? [];
  return (
    <section>
      <h1 className="text-2xl font-bold">Monitoreo de vuelo</h1>
      <DataState isPending={q.isPending} error={q.error} isEmpty={q.data?.length === 0} emptyMessage="Todavía no hay misiones.">
        {running.length === 0 && (
          <p className="mt-3 rounded border border-line bg-white p-3">
            No hay misiones en ejecución. Puedes revisar el recorrido registrado de una misión que ya voló.
          </p>
        )}
        <ul className="mt-4 divide-y divide-line rounded border border-line bg-white">
          {q.data?.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="flex items-center gap-3"><span className="font-bold">{m.name}</span><MissionStatusTag value={m.status} /></span>
              {m.started_at ? (
                <Link className="font-bold text-survey underline" to={`/flight/${m.id}`}>Abrir monitoreo</Link>
              ) : (
                <span className="text-sm">Sin telemetría: la misión no se ha ejecutado</span>
              )}
            </li>
          ))}
        </ul>
      </DataState>
    </section>
  );
}

const SPEEDS = [1, 2, 4];

function Monitor({ missionId }: { missionId: string }) {
  const mission = useMission(missionId);
  const tel = useTelemetry(missionId);
  const { state: serverState } = useHealth();
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const points = tel.data ?? [];
  const last = Math.max(points.length - 1, 0);

  // Al cargar, se muestra el recorrido completo; "Reproducir" lo recorre desde el inicio.
  useEffect(() => { setIdx(last); }, [last]);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setIdx((i) => {
      if (i >= last) { setPlaying(false); return i; }
      return i + 1;
    }), 500 / speed);
    return () => clearInterval(t);
  }, [playing, speed, last]);

  const now = useNow();
  const m = mission.data?.mission;
  const cur = points[Math.min(idx, last)];
  const kind = m && cur ? classifyTelemetry(cur.data_origin, m.status) : null;
  const stale = kind === "live" && cur ? isStale(cur.recorded_at, now) : false;
  const received = cur && mission.data ? mission.data.detections.filter((d) => d.detected_at <= cur.recorded_at) : [];
  const na = "No disponible";

  return (
    <section>
      <Link to="/flight" className="text-sm font-bold text-survey underline">← Elegir otra misión</Link>
      <DataState isPending={mission.isPending || tel.isPending} error={mission.error ?? tel.error} isEmpty={points.length === 0} emptyMessage="Esta misión no tiene telemetría registrada.">
        {m && cur && kind && (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{m.name}</h1>
              <MissionStatusTag value={m.status} />
            </div>
            <p role="status" className={`mt-3 rounded border-2 px-3 py-2 font-bold ${BANNER[kind].cls}`}>{BANNER[kind].text}</p>
            {stale && (
              <p role="alert" className="mt-2 rounded border-2 border-amber-600 bg-amber-50 px-3 py-2 font-bold text-amber-900">
                Datos desactualizados: no se recibe telemetría desde {fmtDateTime(cur.recorded_at)}. Posible pérdida de comunicación.
              </p>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                ["Coordenadas actuales", <span key="c" className="font-mono text-base">{cur.latitude.toFixed(5)}, {cur.longitude.toFixed(5)}</span>],
                ["Altitud", cur.altitude_m == null ? na : `${cur.altitude_m} m`],
                ["Velocidad", cur.speed_ms == null ? na : `${cur.speed_ms} m/s`],
                ["Batería", cur.battery_pct == null ? na : `${cur.battery_pct} %`],
                ["Estado del vehículo", cur.vehicle_state ?? na],
                ["Última actualización de telemetría", <span key="u" className="text-base">{fmtDateTime(cur.recorded_at)}{kind === "simulated" && " (simulada)"}</span>],
                ["Detecciones recibidas", received.length],
                ["Servidor", <ConnectionStatus key="s" state={serverState} />],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded border border-line bg-white px-3 py-2">
                  <dt className="text-sm">{label}</dt>
                  <dd className="mt-0.5 text-xl font-bold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-sm">
              Estación base y enlace con el VANT: sin información disponible. La integración con la estación base se implementa en la Fase 7 y el canal en tiempo real en la Fase 5.
            </p>

            {kind === "simulated" && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded border border-line bg-white p-3">
                <button className="rounded bg-survey px-4 py-2 font-bold text-white" onClick={() => { if (playing) setPlaying(false); else { if (idx >= last) setIdx(0); setPlaying(true); } }}>
                  {playing ? "Pausar" : idx >= last ? "Reproducir desde el inicio" : "Continuar"}
                </button>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Velocidad
                  <select className="rounded border border-line px-2 py-1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                    {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
                  </select>
                </label>
                <label className="flex flex-1 items-center gap-2 text-sm font-bold">
                  Posición
                  <input type="range" className="flex-1" min={0} max={last} value={Math.min(idx, last)} onChange={(e) => { setPlaying(false); setIdx(Number(e.target.value)); }} aria-label="Posición en el recorrido simulado" />
                </label>
              </div>
            )}

            <div className="mt-4">
              <DetectionMap
                detections={received}
                track={points.slice(0, Math.min(idx, last) + 1).map((p): [number, number] => [p.latitude, p.longitude])}
                areas={[m.area]}
                waypoints={m.waypoints}
                uav={{ position: [cur.latitude, cur.longitude], label: kind === "simulated" ? "VANT (simulado)" : "VANT" }}
                className="h-[50vh]"
              />
            </div>
          </>
        )}
      </DataState>
    </section>
  );
}
