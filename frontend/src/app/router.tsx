import { createBrowserRouter } from "react-router-dom";
import { PagePlaceholder } from "../components/PagePlaceholder";
import { SystemPage } from "../features/system/SystemPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { DetectionDetailPage } from "../features/detections/DetectionDetailPage";
import { DetectionsPage } from "../features/detections/DetectionsPage";
import { MapPage } from "../features/map/MapPage";
import { FlightMonitorPage } from "../features/flight-monitor/FlightMonitorPage";
import { HistoryPage } from "../features/history/HistoryPage";
import { MissionDetailPage } from "../features/missions/MissionDetailPage";
import { MissionFormPage } from "../features/missions/MissionFormPage";
import { MissionsPage } from "../features/missions/MissionsPage";
import { Layout } from "./Layout";

const ph = (title: string, phase = "la Fase 3") => <PagePlaceholder title={title} phase={phase} />;

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/map", element: <MapPage /> },
      { path: "/missions", element: <MissionsPage /> },
      { path: "/missions/new", element: <MissionFormPage /> },
      { path: "/missions/:id", element: <MissionDetailPage /> },
      { path: "/missions/:id/edit", element: <MissionFormPage /> },
      { path: "/flight/:missionId?", element: <FlightMonitorPage /> },
      { path: "/detections", element: <DetectionsPage /> },
      { path: "/detections/:id", element: <DetectionDetailPage /> },
      { path: "/history", element: <HistoryPage /> },
      { path: "/orthomosaics", element: ph("Ortomosaicos", "la Fase 6") },
      { path: "/users", element: ph("Usuarios", "la Fase 4") },
      { path: "/system", element: <SystemPage /> },
    ],
  },
]);
