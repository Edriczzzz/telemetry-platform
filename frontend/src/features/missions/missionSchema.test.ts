import { missionSchema } from "./missionSchema";

const base = { name: "Zona A", zone: "Poniente", description: "", status: "borrador" as const, planned_altitude_m: 15, area: [], waypoints: [] };
const area = [[19.5, -99.1], [19.5, -99.2], [19.6, -99.2]];
const wps = [[19.5, -99.1], [19.6, -99.2]];
const messages = (v: unknown) => {
  const r = missionSchema.safeParse(v);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe("missionSchema", () => {
  it("acepta un borrador sin geometría", () => expect(messages(base)).toEqual([]));
  it("valida nombre y zona", () => {
    expect(messages({ ...base, name: "ab" })).toContain("El nombre debe tener al menos 3 caracteres");
    expect(messages({ ...base, zone: "" })).toContain("Indica la zona de inspección");
  });
  it("valida el rango de altitud y que sea número", () => {
    expect(messages({ ...base, planned_altitude_m: 500 })).toContain("La altitud máxima es 120 m");
    expect(messages({ ...base, planned_altitude_m: NaN })).toContain("Debe ser un número");
  });
  it("planificar exige zona, waypoints y altitud", () => {
    const m = messages({ ...base, status: "planificada", planned_altitude_m: null });
    expect(m).toHaveLength(3);
    expect(messages({ ...base, status: "planificada", area, waypoints: wps })).toEqual([]);
  });
  it("rechaza coordenadas fuera de rango", () => {
    expect(messages({ ...base, area: [[91, 0], [0, 0], [1, 1]] }).length).toBeGreaterThan(0);
  });
});
