import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";

vi.mock("../../components/DetectionMap", () => ({ DetectionMap: () => <div data-testid="map" /> }));
vi.mock("../system/useHealth", () => ({ useHealth: () => ({ state: "online" }) }));

it("muestra los indicadores calculados y avisa que son de demostración", async () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(screen.getByText(/datos de demostración, no sobre vuelos reales/)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("Total de misiones").nextSibling).toHaveTextContent("4"));
  expect(screen.getByText("Misiones en ejecución").nextSibling).toHaveTextContent("0");
  expect(screen.getByText("Baches detectados").nextSibling).toHaveTextContent("30");
  expect(screen.getByText("Servidor conectado")).toBeInTheDocument();
});
