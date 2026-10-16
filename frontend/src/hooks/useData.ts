import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { dataSource } from "../services";
import type { DetectionQuery } from "../services/types";

const k = dataSource.name;

export const useMissions = () => useQuery({ queryKey: [k, "missions"], queryFn: () => dataSource.listMissions() });
export const useSummary = () => useQuery({ queryKey: [k, "summary"], queryFn: () => dataSource.getSummary() });
export const useDetections = (q: DetectionQuery) =>
  useQuery({ queryKey: [k, "detections", q], queryFn: () => dataSource.listDetections(q), placeholderData: keepPreviousData });
export const useDetection = (id: string) =>
  useQuery({ queryKey: [k, "detection", id], queryFn: () => dataSource.getDetection(id) });
export const useTrack = (missionId: string) =>
  useQuery({ queryKey: [k, "track", missionId], queryFn: () => dataSource.getTrack(missionId), enabled: !!missionId });
