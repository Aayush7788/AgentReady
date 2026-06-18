import { cleanupExpiredData } from "./supabase";

export interface MaintenanceResult {
  scoreJobs: number;
  privateScores: number;
  contactRequests: number;
  requestLimits: number;
}

export async function runDataMaintenance(): Promise<MaintenanceResult> {
  return cleanupExpiredData(new Date());
}
