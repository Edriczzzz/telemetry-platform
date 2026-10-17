import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HistoryPage } from "./HistoryPage";
import { MissionsPage } from "../missions/MissionsPage";

const wrap = (ui: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
};

describe("HistoryPage", () => {
  it("lista solo misiones ejecutadas y filtra por zona", async () => {
    wrap(<HistoryPage />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Inspecciones encontradas: 3"));
    await waitFor(() => expect(screen.getByRole("option", { name: "Poniente" })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Zona"), { target: { value: "Poniente" } });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Inspecciones encontradas: 1"));
    expect(screen.getByRole("link", { name: "Detalle" })).toHaveAttribute("href", "/missions/demo-m1");
  });

  it("filtra por fecha sin resultados y lo dice", async () => {
    wrap(<HistoryPage />);
    await waitFor(() => screen.getByRole("status"));
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2030-01-01" } });
    expect(await screen.findByText("Ninguna inspección coincide con los filtros.")).toBeInTheDocument();
  });
});

describe("MissionsPage", () => {
  it("lista misiones y filtra por estado", async () => {
    wrap(<MissionsPage />);
    await waitFor(() => expect(screen.getAllByRole("row").length).toBeGreaterThanOrEqual(5));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "planificada" } });
    await waitFor(() => expect(screen.getByRole("link", { name: "Recorrido zona C" })).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByRole("link", { name: "Recorrido zona A" })).toBeNull());
  });
});
