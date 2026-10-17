import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { FlightMonitorPage } from "./FlightMonitorPage";

vi.mock("../../components/DetectionMap", () => ({ DetectionMap: () => <div data-testid="map" /> }));
vi.mock("../system/useHealth", () => ({ useHealth: () => ({ state: "online" }) }));

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path="/flight/:missionId?" element={<FlightMonitorPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("FlightMonitorPage", () => {
  it("rotula claramente los datos simulados y no inventa sensores", async () => {
    renderAt("/flight/demo-m1");
    expect(await screen.findByText(/DATOS SIMULADOS DE DEMOSTRACIÓN/)).toBeInTheDocument();
    expect(screen.getByText("Detecciones recibidas").nextSibling).toHaveTextContent("14");
    expect(screen.getByText(/Estación base y enlace con el VANT: sin información disponible/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull(); // lo simulado nunca activa "datos desactualizados"
    expect(screen.getByRole("button", { name: "Reproducir desde el inicio" })).toBeInTheDocument();
  });

  it("avisa cuando la misión no tiene telemetría", async () => {
    renderAt("/flight/demo-m3");
    expect(await screen.findByText("Esta misión no tiene telemetría registrada.")).toBeInTheDocument();
  });

  it("sin misión elegida indica que no hay misiones en ejecución", async () => {
    renderAt("/flight");
    expect(await screen.findByText(/No hay misiones en ejecución/)).toBeInTheDocument();
    expect(screen.getAllByText("Abrir monitoreo")).toHaveLength(3);
    expect(screen.getByText(/Sin telemetría: la misión no se ha ejecutado/)).toBeInTheDocument();
  });
});
