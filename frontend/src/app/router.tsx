import { createBrowserRouter } from "react-router-dom";
import { PagePlaceholder } from "../components/PagePlaceholder";
import { SystemPage } from "../features/system/SystemPage";
import { Layout } from "./Layout";

const ph = (title: string, phase = "la Fase 3") => <PagePlaceholder title={title} phase={phase} />;

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: ph("Panel") },
      { path: "/map", element: ph("Mapa geoespacial") },
      { path: "/missions", element: ph("Misiones") },
      { path: "/flight", element: ph("Monitoreo de vuelo", "las Fases 3 y 5") },
      { path: "/detections", element: ph("Inventario de baches") },
      { path: "/history", element: ph("Historial de inspecciones") },
      { path: "/orthomosaics", element: ph("Ortomosaicos", "la Fase 6") },
      { path: "/users", element: ph("Usuarios", "la Fase 4") },
      { path: "/system", element: <SystemPage /> },
    ],
  },
]);
