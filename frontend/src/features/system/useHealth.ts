import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/apiClient";

export interface HealthResponse {
  status: "ok" | "degraded";
  environment: string;
  database: "ok" | "unavailable";
  server_time: string;
}

export type ServerState = "online" | "degraded" | "offline" | "checking";

export function useHealth() {
  const query = useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<HealthResponse>("/api/v1/health"),
    refetchInterval: 10_000,
    retry: false,
  });
  const state: ServerState = query.isPending
    ? "checking"
    : query.isError
      ? "offline"
      : query.data.status === "ok"
        ? "online"
        : "degraded";
  return { state, data: query.data, checkedAt: query.dataUpdatedAt || null };
}
