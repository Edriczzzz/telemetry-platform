import { buildDemoDataset } from "./demoData";
import { createDemoSource } from "./demoSource";
import { queryMissions } from "./queryMissions";
import type { MissionInput } from "../../types/domain";

const ds = buildDemoDataset();

const draft: MissionInput = {
  name: "Misión de prueba", description: "", zone: "Centro", status: "borrador",
  planned_altitude_m: 15, area: [], waypoints: [],
};
const area: [number, number][] = [[19.5, -99.1], [19.5, -99.2], [19.6, -99.2]];
const wps: [number, number][] = [[19.5, -99.1], [19.6, -99.2]];

describe("queryMissions", () => {
  it("filtra por estado, zona, severidad y fechas", () => {
    expect(queryMissions(ds.missions, { status: "completada" })).toHaveLength(2);
    expect(queryMissions(ds.missions, { zone: "Oriente" }).map((m) => m.id)).toEqual(["demo-m2"]);
    expect(queryMissions(ds.missions, { onlyExecuted: true })).toHaveLength(3);
    expect(queryMissions(ds.missions, { from: "2026-10-12", to: "2026-10-12" }).map((m) => m.id)).toEqual(["demo-m2"]);
    for (const m of queryMissions(ds.missions, { severity: "alta" })) expect(m.severity_counts.alta).toBeGreaterThan(0);
  });
  it("ordena de la más reciente a la más antigua", () => {
    const ids = queryMissions(ds.missions).map((m) => m.id);
    expect(ids[0]).toBe("demo-m3"); // creada el 14 de octubre, sin ejecutar
  });
});

describe("telemetría de demostración", () => {
  it("cada detección ocurre donde estaba el VANT en ese instante", () => {
    for (const d of ds.detections) {
      const pts = ds.telemetry[d.mission_id];
      expect(d.detected_at >= pts[0].recorded_at && d.detected_at <= pts.at(-1)!.recorded_at).toBe(true);
      const near = Math.min(...pts.map((p) => Math.hypot(p.latitude - d.latitude, p.longitude - d.longitude)));
      expect(near).toBeLessThan(0.0001);
    }
  });
  it("la misión interrumpida solo recorrió parte de la ruta", () => {
    const m4 = ds.missions.find((m) => m.id === "demo-m4")!;
    expect(ds.tracks["demo-m4"].length).toBe(24);
    expect(ds.tracks["demo-m4"].length).toBeLessThan(m4.waypoints.length * 6);
  });
  it("una misión sin ejecutar no tiene telemetría ni trayectoria", () => {
    expect(ds.telemetry["demo-m3"]).toEqual([]);
    expect(ds.tracks["demo-m3"]).toEqual([]);
  });
  it("todo punto está rotulado como simulado", () => {
    expect(Object.values(ds.telemetry).flat().every((p) => p.data_origin === "simulated")).toBe(true);
  });
});

describe("fuente de demostración: misiones", () => {
  it("crea una misión en borrador y aparece en el listado y su historial", async () => {
    const src = createDemoSource();
    const m = await src.createMission(draft);
    expect((await src.listMissions()).some((x) => x.id === m.id)).toBe(true);
    expect((await src.getMission(m.id)).events[0].text).toBe("Misión creada");
  });
  it("rechaza planificar sin zona, ruta o altitud", async () => {
    const src = createDemoSource();
    await expect(src.createMission({ ...draft, status: "planificada" })).rejects.toThrow(/zona/);
    await expect(src.createMission({ ...draft, status: "planificada", area })).rejects.toThrow(/waypoints/);
    await expect(src.createMission({ ...draft, status: "planificada", area, waypoints: wps, planned_altitude_m: null })).rejects.toThrow(/altitud/);
    await expect(src.createMission({ ...draft, status: "planificada", area, waypoints: wps })).resolves.toBeDefined();
  });
  it("solo permite editar borradores y planificadas", async () => {
    const src = createDemoSource();
    await expect(src.updateMission("demo-m1", draft)).rejects.toThrow(/borrador o planificadas/);
    const updated = await src.updateMission("demo-m3", { ...draft, name: "Zona C editada", status: "planificada", area, waypoints: wps });
    expect(updated.name).toBe("Zona C editada");
    expect((await src.getMission("demo-m3")).events.at(-1)!.text).toBe("Misión modificada");
  });
});
