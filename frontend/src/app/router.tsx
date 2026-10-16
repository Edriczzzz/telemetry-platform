import { createBrowserRouter } from "react-router-dom";
import { PagePlaceholder } from "../components/PagePlaceholder";
import { SystemPage } from "../features/system/SystemPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { DetectionDetailPage } from "../features/detections/DetectionDetailPage";
import { DetectionsPage } from "../features/detections/DetectionsPage";
import { MapPage } from "../features/map/MapPage";
import { Layout } from "./Layout";

const ph = (title: string, phase = "la Fase 3") => <PagePlaceholder title={title} phase={phase} />;

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/map", element: <MapPage /> },
      { path: "/missions", element: ph("Misiones") },
      { path: "/flight", element: ph("Monitoreo de vuelo", "las Fases 3 y 5") },
      { path: "/detections", element: <DetectionsPage /> },
      { path: "/detections/:id", element: <DetectionDetailPage /> },
      { path: "/history", element: ph("Historial de inspecciones") },
      { path: "/orthomosaics", element: ph("Ortomosaicos", "la Fase 6") },
      { path: "/users", element: ph("Usuarios", "la Fase 4") },
      { path: "/system", element: <SystemPage /> },
    ],
  },
]);
