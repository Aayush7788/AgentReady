import companies from "@/data/companies.json";
import { CATEGORIES } from "./categorize";
import { getSiteUrl, getSupabaseStatus } from "./env";
import { AFDOCS_VERSION } from "./scoring";

export function getRuntimeStatus() {
  const supabase = getSupabaseStatus();

  return {
    status: supabase.configured ? "ready" : "setup_required",
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
    timestamp: new Date().toISOString(),
  };
}

