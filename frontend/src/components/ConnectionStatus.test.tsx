import { render, screen } from "@testing-library/react";
import { ConnectionStatus } from "./ConnectionStatus";
import { DemoBadge } from "./DemoBadge";

describe("ConnectionStatus", () => {
  it.each([
    ["online", "Servidor conectado"],
    ["degraded", "Servidor con fallas parciales"],
    ["offline", "Sin conexión con el servidor"],
    ["checking", "Comprobando servidor…"],
  ] as const)("muestra texto para el estado %s", (state, text) => {
    render(<ConnectionStatus state={state} />);
    expect(screen.getByRole("status")).toHaveTextContent(text);
  });
});

describe("DemoBadge", () => {
  it("se muestra solo cuando el modo demostración está activo", () => {
    const { rerender } = render(<DemoBadge active />);
    expect(screen.getByText("Modo demostración")).toBeInTheDocument();
    rerender(<DemoBadge active={false} />);
    expect(screen.queryByText("Modo demostración")).toBeNull();
  });
});
