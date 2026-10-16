import { render, screen } from "@testing-library/react";
import { AttentionTag, SeverityTag, ValidationTag } from "./Tags";

it("los estados se comunican con texto, no solo con color", () => {
  render(<><SeverityTag value="alta" /><AttentionTag value="en_reparacion" /><ValidationTag value="falso_positivo" /></>);
  expect(screen.getByText("Alta")).toBeInTheDocument();
  expect(screen.getByText("En reparación")).toBeInTheDocument();
  expect(screen.getByText("Descartada como falso positivo")).toBeInTheDocument();
});
