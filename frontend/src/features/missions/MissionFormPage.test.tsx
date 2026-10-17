import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MissionFormPage } from "./MissionFormPage";

vi.mock("../../components/RouteEditor", () => ({
  RouteEditor: ({ onChange }: { onChange: (v: unknown) => void }) => (
    <button type="button" onClick={() => onChange({ area: [[19.5, -99.1], [19.5, -99.2], [19.6, -99.2]], waypoints: [[19.5, -99.1], [19.6, -99.2]] })}>
      simular dibujo
    </button>
  ),
}));

function renderForm(path = "/missions/new") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/missions/new" element={<MissionFormPage />} />
          <Route path="/missions/:id/edit" element={<MissionFormPage />} />
          <Route path="/missions/:id" element={<div>PÁGINA DE DETALLE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MissionFormPage", () => {
  it("muestra errores comprensibles al enviar vacío", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Guardar misión" }));
    expect(await screen.findByText("El nombre debe tener al menos 3 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Indica la zona de inspección")).toBeInTheDocument();
  });

  it("exige zona y ruta para planificar", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Misión nueva" } });
    fireEvent.change(screen.getByLabelText("Zona de inspección"), { target: { value: "Centro" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "planificada" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar misión" }));
    expect(await screen.findByText("Para planificar, dibuja una zona de al menos 3 vértices")).toBeInTheDocument();
    expect(screen.getByText("Para planificar, define al menos 2 waypoints")).toBeInTheDocument();
  });

  it("guarda una misión planificada y navega a su detalle", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Misión nueva" } });
    fireEvent.change(screen.getByLabelText("Zona de inspección"), { target: { value: "Centro" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "planificada" } });
    fireEvent.click(screen.getByRole("button", { name: "simular dibujo" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar misión" }));
    await waitFor(() => expect(screen.getByText("PÁGINA DE DETALLE")).toBeInTheDocument());
  });

  it("no permite editar una misión que ya voló", async () => {
    renderForm("/missions/demo-m1/edit");
    expect(await screen.findByText("Solo se pueden editar misiones en borrador o planificadas.")).toBeInTheDocument();
  });
});
