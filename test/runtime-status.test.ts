import { afterEach, describe, expect, it } from "vitest";
import companies from "@/data/companies.json";
import { getRuntimeStatus } from "@/lib/runtime-status";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("getRuntimeStatus", () => {
  it("summarizes setup state without exposing secrets", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://agentready.example";
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const status = getRuntimeStatus();

    expect(status.status).toBe("setup_required");
    expect(status.siteUrl).toBe("https://agentready.example");
    expect(status.seedData.companies).toBe(companies.length);
    expect(status.supabase.configured).toBe(false);
    expect(status.supabase.missing).toContain("SUPABASE_URL");
    expect(JSON.stringify(status)).not.toContain("SERVICE_ROLE_KEY=");
  });
});

