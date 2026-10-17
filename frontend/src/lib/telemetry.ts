import { useEffect, useState } from "react";
import type { DataOrigin, MissionStatus } from "../types/domain";

export const TELEMETRY_STALE_SECONDS = 10;

export type TelemetryKind = "live" | "historical" | "simulated";

/**
 * Distingue los tres tipos de dato que pide el monitoreo:
 * recibido y confirmado (en vivo), información histórica y datos simulados.
 */
export function classifyTelemetry(origin: DataOrigin, missionStatus: MissionStatus): TelemetryKind {
  if (origin === "simulated") return "simulated";
  if (origin === "real" && missionStatus === "en_ejecucion") return "live";
  return "historical";
}

export const isStale = (lastIso: string, nowMs: number, thresholdSec = TELEMETRY_STALE_SECONDS) =>
  nowMs - Date.parse(lastIso) > thresholdSec * 1000;

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
