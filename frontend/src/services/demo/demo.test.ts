import { buildDemoDataset } from "./demoData";
import { queryDetections } from "./queryDetections";
import type { DetectionRow } from "../../types/domain";

const ds = buildDemoDataset();
const rows: DetectionRow[] = ds.detections.map((d) => ({
  ...d,
  mission_name: ds.missions.find((m) => m.id === d.mission_id)!.name,
}));

describe("datos de demostración", () => {
  it("son deterministas", () => {
    expect(buildDemoDataset()).toEqual(buildDemoDataset());
  });

  it("todo está rotulado como simulado", () => {
    expect(ds.detections.every((d) => d.data_origin === "simulated")).toBe(true);
    expect(ds.missions.every((m) => m.data_origin === "simulated")).toBe(true);
  });

  it("validación y atención son coherentes", () => {
    for (const d of ds.detections) {
      if (d.validation_status !== "confirmado") expect(d.attention_status).toBe("pendiente");
    }
  });

  it("el conteo de detecciones por misión coincide", () => {
    for (const m of ds.missions) {
      expect(m.detections_count).toBe(ds.detections.filter((d) => d.mission_id === m.id).length);
    }
  });

  it("las misiones sin ejecutar no tienen detecciones", () => {
    const planned = ds.missions.find((m) => m.status === "planificada")!;
    expect(planned.detections_count).toBe(0);
  });
});

describe("queryDetections", () => {
  it("filtra por severidad", () => {
    const r = queryDetections(rows, { severity: "alta", pageSize: 500 });
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.every((d) => d.severity === "alta")).toBe(true);
  });

  it("filtra por misión y combina filtros", () => {
    const r = queryDetections(rows, { missionId: "demo-m1", severity: "baja", pageSize: 500 });
    expect(r.items.every((d) => d.mission_id === "demo-m1" && d.severity === "baja")).toBe(true);
  });

  it("busca por ID", () => {
    const r = queryDetections(rows, { search: "DEMO-DET-001" });
    expect(r.items.map((d) => d.id)).toEqual(["demo-det-001"]);
  });

  it("ordena por área ascendente y descendente", () => {
    const asc = queryDetections(rows, { sortBy: "area_value", sortDir: "asc", pageSize: 500 }).items;
    const desc = queryDetections(rows, { sortBy: "area_value", sortDir: "desc", pageSize: 500 }).items;
    expect(asc[0].area_value!).toBeLessThanOrEqual(asc[1].area_value!);
    expect(desc[0].area_value!).toBeGreaterThanOrEqual(desc[1].area_value!);
  });

  it("ordena severidad por nivel, no alfabéticamente", () => {
    const r = queryDetections(rows, { sortBy: "severity", sortDir: "desc", pageSize: 500 }).items;
    expect(r[0].severity).toBe("alta");
    expect(r.at(-1)!.severity).toBe("baja");
  });

  it("pagina y acota la página fuera de rango", () => {
    const p1 = queryDetections(rows, { pageSize: 10, page: 1 });
    const huge = queryDetections(rows, { pageSize: 10, page: 999 });
    expect(p1.items).toHaveLength(10);
    expect(huge.page).toBe(Math.ceil(rows.length / 10));
  });

  it("filtra por bbox y por fechas", () => {
    const r = queryDetections(rows, { bbox: [19.5037, -99.1484, 19.5057, -99.1456], pageSize: 500 });
    expect(r.total).toBeGreaterThan(0);
    expect(r.total).toBeLessThan(rows.length);
    const day = queryDetections(rows, { from: "2026-10-12", to: "2026-10-12", pageSize: 500 });
    expect(day.items.every((d) => d.detected_at.startsWith("2026-10-12"))).toBe(true);
  });
});
