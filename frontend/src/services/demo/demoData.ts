import type {
  AttentionStatus,
  Detection,
  DetectionHistoryEntry,
  LatLng,
  Mission,
  Severity,
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

function rectangle(c: LatLng): LatLng[] {
  return [
    [c[0] - D_LAT, c[1] - D_LON],
    [c[0] - D_LAT, c[1] + D_LON],
    [c[0] + D_LAT, c[1] + D_LON],
    [c[0] + D_LAT, c[1] - D_LON],
  ];
}

/** Ruta de cobertura en "zigzag", como la generaría el planificador de misiones. */
function lawnmower(c: LatLng, rows = 5, cols = 12): LatLng[] {
  const pts: LatLng[] = [];
  for (let r = 0; r < rows; r++) {
    const lat = c[0] - D_LAT + (2 * D_LAT * r) / (rows - 1);
    for (let k = 0; k < cols; k++) {
      const f = k / (cols - 1);
      const lon = r % 2 === 0 ? c[1] - D_LON + 2 * D_LON * f : c[1] + D_LON - 2 * D_LON * f;
      pts.push([lat, lon]);
    }
  }
  return pts;
}

interface MissionSeed {
  id: string;
  name: string;
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
    id: "demo-m1", name: "Recorrido zona A", status: "completada", center: [19.5047, -99.147],
    description: "Circuito de vialidades interiores, zona poniente.",
    created_at: "2026-10-07T18:00:00Z", started_at: "2026-10-08T16:00:00Z", ended_at: "2026-10-08T16:22:00Z", detections: 14,
  },
  {
    id: "demo-m2", name: "Recorrido zona B", status: "completada", center: [19.5047, -99.1445],
    description: "Estacionamiento y accesos, zona oriente.",
    created_at: "2026-10-10T18:00:00Z", started_at: "2026-10-12T15:30:00Z", ended_at: "2026-10-12T15:49:00Z", detections: 12,
  },
  {
    id: "demo-m3", name: "Recorrido zona C", status: "planificada", center: [19.5068, -99.147],
    description: "Misión planificada; aún no se ha ejecutado.",
    created_at: "2026-10-14T18:00:00Z", started_at: null, ended_at: null, detections: 0,
  },
  {
    id: "demo-m4", name: "Vuelo de prueba con pérdida de enlace", status: "con_error", center: [19.5028, -99.147],
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

export interface DemoDataset {
  missions: Mission[];
  detections: Detection[];
  tracks: Record<string, LatLng[]>;
  history: Record<string, DetectionHistoryEntry[]>;
}

export function buildDemoDataset(): DemoDataset {
  const rng = mulberry32(2026);
  const tracks: Record<string, LatLng[]> = {};
  const detections: Detection[] = [];
  const history: Record<string, DetectionHistoryEntry[]> = {};
  let n = 0;
  let hid = 0;

  for (const m of SEEDS) {
    const track = lawnmower(m.center);
    tracks[m.id] = track;
    for (let i = 0; i < m.detections; i++) {
      n++;
      const base = track[Math.floor(rng() * track.length)];
      const severity = pick<Severity>(rng, [["baja", 45], ["media", 35], ["alta", 20]]);
      const [lo, hi] = AREA_RANGE[severity];
      const validation = pick<ValidationStatus>(rng, [["sin_revisar", 50], ["confirmado", 40], ["falso_positivo", 10]]);
      const attention: AttentionStatus =
        validation === "confirmado"
          ? pick<AttentionStatus>(rng, [["pendiente", 40], ["programado", 25], ["en_reparacion", 10], ["atendido", 25]])
          : "pendiente";
      const detectedAt = new Date(new Date(m.started_at!).getTime() + i * 37_000).toISOString();
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
  }

  const missions: Mission[] = SEEDS.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    status: m.status,
    area: rectangle(m.center),
    created_at: m.created_at,
    started_at: m.started_at,
    ended_at: m.ended_at,
    detections_count: detections.filter((d) => d.mission_id === m.id).length,
    data_origin: "simulated",
  }));

  return { missions, detections, tracks, history };
}
