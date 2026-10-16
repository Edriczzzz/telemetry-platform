import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DetectionsPage } from "./DetectionsPage";

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DetectionsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DetectionsPage (datos de demostración)", () => {
  it("muestra la tabla paginada con las columnas pedidas", async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByRole("row").length).toBe(11)); // encabezado + 10
    for (const col of ["ID", "Fecha de detección", "Ubicación", "Severidad", "Área estimada", "Misión", "Estado de atención", "Acciones"]) {
      expect(screen.getByRole("columnheader", { name: new RegExp(col) })).toBeInTheDocument();
    }
    expect(screen.getByText(/Página 1 de/)).toBeInTheDocument();
  });

  it("filtra al buscar y avisa si no hay resultados", async () => {
    renderPage();
    await waitFor(() => screen.getAllByRole("row"));
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "zzz-no-existe" } });
    await waitFor(() => expect(screen.getByText("Ningún bache coincide con los filtros.")).toBeInTheDocument());
  });

  it("cambia el orden al pulsar un encabezado", async () => {
    renderPage();
    await waitFor(() => screen.getAllByRole("row"));
    fireEvent.click(screen.getByRole("button", { name: /^Área estimada/ }));
    await waitFor(() => expect(screen.getByRole("columnheader", { name: /Área estimada/ })).toHaveAttribute("aria-sort", "ascending"));
  });
});
