import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dataSource } from "../services";
import type { DetectionQuery, MissionQuery } from "../services/types";
import type { MissionInput } from "../types/domain";

const k = dataSource.name;

export const useMissions = (q?: MissionQuery) =>
  useQuery({ queryKey: [k, "missions", q ?? {}], queryFn: () => dataSource.listMissions(q), placeholderData: keepPreviousData });
export const useMission = (id: string) =>
  useQuery({ queryKey: [k, "mission", id], queryFn: () => dataSource.getMission(id), enabled: !!id });
export const useTelemetry = (id: string) =>
  useQuery({ queryKey: [k, "telemetry", id], queryFn: () => dataSource.getTelemetry(id), enabled: !!id });
export const useSummary = () => useQuery({ queryKey: [k, "summary"], queryFn: () => dataSource.getSummary() });
export const useDetections = (q: DetectionQuery) =>
  useQuery({ queryKey: [k, "detections", q], queryFn: () => dataSource.listDetections(q), placeholderData: keepPreviousData });
export const useDetection = (id: string) =>
  useQuery({ queryKey: [k, "detection", id], queryFn: () => dataSource.getDetection(id) });
export const useTrack = (missionId: string) =>
  useQuery({ queryKey: [k, "track", missionId], queryFn: () => dataSource.getTrack(missionId), enabled: !!missionId });

/** Crea (sin id) o actualiza (con id) una misión y refresca todo lo que dependa de ella. */
export function useSaveMission(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MissionInput) => (id ? dataSource.updateMission(id, input) : dataSource.createMission(input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: [k] }),
  });
}
