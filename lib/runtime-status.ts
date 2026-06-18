import companies from "@/data/companies.json";
import { CATEGORIES } from "./categorize";
import {
  getMaintenanceStatus,
  getSiteUrl,
  getSupabaseStatus,
} from "./env";
import { AFDOCS_VERSION } from "./scoring";

export function getRuntimeStatus() {
  const supabase = getSupabaseStatus();
  const maintenance = getMaintenanceStatus();
  const ready = supabase.configured && maintenance.configured;

  return {
    status: ready ? "ready" : "setup_required",
    siteUrl: getSiteUrl(),
    scoringEngine: {
      name: "afdocs",
      version: AFDOCS_VERSION,
    },
    seedData: {
      companies: companies.length,
      categories: CATEGORIES.length,
    },
    supabase,
    maintenance,
    timestamp: new Date().toISOString(),
  };
}
