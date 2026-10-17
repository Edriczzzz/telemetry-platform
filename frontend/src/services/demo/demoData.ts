import type {
  AttentionStatus,
  Detection,
  DetectionHistoryEntry,
  LatLng,
  Mission,
  MissionEvent,
  Severity,
  TelemetryPoint,
  ValidationStatus,
} from "../../types/domain";

/**
 * DATOS DE DEMOSTRACIÓN. Todo es simulado (data_origin = "simulated").
 * Las coordenadas son aproximadas, en torno a la Unidad Profesional Adolfo López Mateos.
 * La generación es determinista: el mismo código produce siempre los mismos datos.
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const D_LAT = 0.001;
const D_LON = 0.0014;
const ROWS = 5;
const COLS = 12;

function rectangle(c: LatLng): LatLng[] {
  return [
    [c[0] - D_LAT, c[1] - D_LON],
    [c[0] - D_LAT, c[1] + D_LON],
    [c[0] + D_LAT, c[1] + D_LON],
    [c[0] + D_LAT, c[1] - D_LON],
  ];
}

/** Ruta de cobertura en "zigzag", como la generaría el planificador de misiones. */
function lawnmower(c: LatLng): LatLng[] {
  const pts: LatLng[] = [];
  for (let r = 0; r < ROWS; r++) {
    const lat = c[0] - D_LAT + (2 * D_LAT * r) / (ROWS - 1);
    for (let k = 0; k < COLS; k++) {
      const f = k / (COLS - 1);
      const lon = r % 2 === 0 ? c[1] - D_LON + 2 * D_LON * f : c[1] + D_LON - 2 * D_LON * f;
      pts.push([lat, lon]);
    }
  }
  return pts;
}

/** Los waypoints planificados son los extremos de cada pasada. */
const turnPoints = (track: LatLng[]): LatLng[] =>
  track.filter((_, i) => i % COLS === 0 || i % COLS === COLS - 1);

interface MissionSeed {
  id: string;
  name: string;
  zone: string;
  description: string;
  status: Mission["status"];
  center: LatLng;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  detections: number;
}

const SEEDS: MissionSeed[] = [
  {
    id: "demo-m1", name: "Recorrido zona A", zone: "Poniente", status: "completada", center: [19.5047, -99.147],
    description: "Circuito de vialidades interiores, zona poniente.",
    created_at: "2026-10-07T18:00:00Z", started_at: "2026-10-08T16:00:00Z", ended_at: "2026-10-08T16:22:00Z", detections: 14,
  },
  {
    id: "demo-m2", name: "Recorrido zona B", zone: "Oriente", status: "completada", center: [19.5047, -99.1445],
    description: "Estacionamiento y accesos, zona oriente.",
    created_at: "2026-10-10T18:00:00Z", started_at: "2026-10-12T15:30:00Z", ended_at: "2026-10-12T15:49:00Z", detections: 12,
  },
  {
    id: "demo-m3", name: "Recorrido zona C", zone: "Norte", status: "planificada", center: [19.5068, -99.147],
    description: "Misión planificada; aún no se ha ejecutado.",
    created_at: "2026-10-14T18:00:00Z", started_at: null, ended_at: null, detections: 0,
  },
  {
    id: "demo-m4", name: "Vuelo de prueba con pérdida de enlace", zone: "Sur", status: "con_error", center: [19.5028, -99.147],
    description: "Misión interrumpida por pérdida de comunicación.",
    created_at: "2026-10-13T18:00:00Z", started_at: "2026-10-14T17:00:00Z", ended_at: "2026-10-14T17:06:00Z", detections: 4,
  },
];

function pick<T>(rng: () => number, options: [T, number][]): T {
  const total = options.reduce((s, [, w]) => s + w, 0);
  let x = rng() * total;
  for (const [v, w] of options) {
    if ((x -= w) <= 0) return v;
  }
  return options[options.length - 1][0];
}

const AREA_RANGE: Record<Severity, [number, number]> = { baja: [0.05, 0.25], media: [0.25, 0.8], alta: [0.8, 2.5] };

/** Recalcula los conteos de una misión a partir de sus detecciones. */
export function withStats(m: Mission, dets: Detection[]): Mission {
  const mine = dets.filter((d) => d.mission_id === m.id);
  const counts: Record<Severity, number> = { baja: 0, media: 0, alta: 0 };
  mine.forEach((d) => counts[d.severity]++);
  return {
    ...m,
    detections_count: mine.length,
    severity_counts: counts,
    attended_count: mine.filter((d) => d.attention_status === "atendido").length,
  };
}

export interface DemoDataset {
  missions: Mission[];
  detections: Detection[];
  tracks: Record<string, LatLng[]>; // trayectoria recorrida
  telemetry: Record<string, TelemetryPoint[]>;
  history: Record<string, DetectionHistoryEntry[]>;
  events: Record<string, MissionEvent[]>;
}

export function buildDemoDataset(): DemoDataset {
  const rng = mulberry32(2026);
  const tracks: Record<string, LatLng[]> = {};
  const telemetry: Record<string, TelemetryPoint[]> = {};
  const events: Record<string, MissionEvent[]> = {};
  const detections: Detection[] = [];
  const history: Record<string, DetectionHistoryEntry[]> = {};
  const baseMissions: Mission[] = [];
  let n = 0;
  let hid = 0;
  let eid = 0;

  for (const m of SEEDS) {
    const full = lawnmower(m.center);
    // Una misión interrumpida solo recorrió parte de la ruta planificada.
    const limit = m.status === "con_error" ? Math.floor(full.length * 0.4) : full.length;
    const executed = m.started_at !== null;
    const start = executed ? new Date(m.started_at!).getTime() : 0;
    const duration = executed ? new Date(m.ended_at!).getTime() - start : 0;
    const timeAt = (idx: number) => new Date(start + (idx / (full.length - 1)) * duration).toISOString();

    tracks[m.id] = executed ? full.slice(0, limit) : [];
    telemetry[m.id] = executed
      ? full.slice(0, limit).map((p, idx) => ({
          recorded_at: timeAt(idx),
          latitude: p[0],
          longitude: p[1],
          altitude_m: +(15 + Math.sin(idx / 3) * 0.6).toFixed(1),
          speed_ms: +(4 + Math.cos(idx / 4) * 0.4).toFixed(1),
          battery_pct: Math.max(5, Math.round(100 - (duration / 60000) * 2.5 * (idx / (full.length - 1)))),
          vehicle_state: "AUTO",
          data_origin: "simulated" as const,
        }))
      : [];

    // Cada detección ocurre donde el VANT estaba en ese instante.
    const idxs = Array.from({ length: m.detections }, () => Math.floor(rng() * limit)).sort((a, b) => a - b);
    for (const idx of idxs) {
      n++;
      const base = full[idx];
      const severity = pick<Severity>(rng, [["baja", 45], ["media", 35], ["alta", 20]]);
      const [lo, hi] = AREA_RANGE[severity];
      const validation = pick<ValidationStatus>(rng, [["sin_revisar", 50], ["confirmado", 40], ["falso_positivo", 10]]);
      const attention: AttentionStatus =
        validation === "confirmado"
          ? pick<AttentionStatus>(rng, [["pendiente", 40], ["programado", 25], ["en_reparacion", 10], ["atendido", 25]])
          : "pendiente";
      const detectedAt = timeAt(idx);
      const id = `demo-det-${String(n).padStart(3, "0")}`;

      detections.push({
        id,
        mission_id: m.id,
        detected_at: detectedAt,
        latitude: +(base[0] + (rng() - 0.5) * 0.00008).toFixed(6),
        longitude: +(base[1] + (rng() - 0.5) * 0.00008).toFixed(6),
        severity,
        area_value: +(lo + rng() * (hi - lo)).toFixed(2),
        area_unit: "m2",
        confidence: +(0.6 + rng() * 0.38).toFixed(2),
        gnss_accuracy_m: +(1.5 + rng() * 2.5).toFixed(1),
        frame_id: `IMG_${1000 + n}.JPG`,
        source: "model",
        attention_status: attention,
        validation_status: validation,
        data_origin: "simulated",
      });

      const entries: DetectionHistoryEntry[] = [];
      const t0 = new Date(detectedAt).getTime();
      if (validation !== "sin_revisar") {
        entries.push({
          id: ++hid, field: "validation_status", old_value: "sin_revisar", new_value: validation,
          user_name: "Operador (demo)", changed_at: new Date(t0 + 2 * 3600_000).toISOString(),
          comment: validation === "falso_positivo" ? "Sombra sobre el pavimento, no es un bache." : null,
        });
      }
      if (attention !== "pendiente") {
        const steps: AttentionStatus[] = ["pendiente", "programado", "en_reparacion", "atendido"];
        for (let s = 1; s <= steps.indexOf(attention); s++) {
          entries.push({
            id: ++hid, field: "attention_status", old_value: steps[s - 1], new_value: steps[s],
            user_name: "Personal de campo (demo)", changed_at: new Date(t0 + (24 * s + 3) * 3600_000).toISOString(),
            comment: null,
          });
        }
      }
      history[id] = entries;
    }

    const ev: MissionEvent[] = [{ id: ++eid, at: m.created_at, text: "Misión creada", user_name: "Operador (demo)" }];
    if (executed) ev.push({ id: ++eid, at: m.started_at!, text: "Inicio de la misión (reportado por la estación base)", user_name: null });
    if (m.status === "completada") ev.push({ id: ++eid, at: m.ended_at!, text: "Misión completada", user_name: null });
    if (m.status === "con_error") ev.push({ id: ++eid, at: m.ended_at!, text: "Misión terminada con error: pérdida de enlace", user_name: null });
    events[m.id] = ev;

    baseMissions.push({
      id: m.id, name: m.name, description: m.description, zone: m.zone, status: m.status,
      planned_altitude_m: 15, area: rectangle(m.center), waypoints: turnPoints(full),
      created_at: m.created_at, started_at: m.started_at, ended_at: m.ended_at,
      detections_count: 0, severity_counts: { baja: 0, media: 0, alta: 0 }, attended_count: 0,
      data_origin: "simulated",
    });
  }

  return { missions: baseMissions.map((m) => withStats(m, detections)), detections, tracks, telemetry, history, events };
}
