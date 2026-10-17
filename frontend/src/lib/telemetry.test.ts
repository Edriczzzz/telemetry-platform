import { classifyTelemetry, isStale } from "./telemetry";

describe("classifyTelemetry", () => {
  it("separa simulado, en vivo e histórico", () => {
    expect(classifyTelemetry("simulated", "completada")).toBe("simulated");
    expect(classifyTelemetry("simulated", "en_ejecucion")).toBe("simulated"); // lo simulado nunca se presenta como real
    expect(classifyTelemetry("real", "en_ejecucion")).toBe("live");
    expect(classifyTelemetry("real", "completada")).toBe("historical");
    expect(classifyTelemetry("historical", "en_ejecucion")).toBe("historical");
  });
});

describe("isStale", () => {
  const t = "2026-10-16T12:00:00Z";
  const ms = Date.parse(t);
  it("detecta datos desactualizados según el umbral", () => {
    expect(isStale(t, ms + 5_000, 10)).toBe(false);
    expect(isStale(t, ms + 10_000, 10)).toBe(false);
    expect(isStale(t, ms + 10_001, 10)).toBe(true);
  });
});
