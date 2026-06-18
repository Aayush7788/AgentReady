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
    delete process.env.CRON_SECRET;

    const status = getRuntimeStatus();

    expect(status.status).toBe("setup_required");
    expect(status.siteUrl).toBe("https://agentready.example");
    expect(status.seedData.companies).toBe(companies.length);
    expect(status.supabase.configured).toBe(false);
    expect(status.supabase.missing).toContain("SUPABASE_URL");
    expect(status.maintenance).toEqual({
      configured: false,
      missing: ["CRON_SECRET"],
    });
    expect(JSON.stringify(status)).not.toContain("SERVICE_ROLE_KEY=");
  });

  it("reports ready only when storage and maintenance are configured", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.CRON_SECRET = "0123456789abcdef0123456789abcdef";

    const status = getRuntimeStatus();

    expect(status.status).toBe("ready");
    expect(status.supabase.configured).toBe(true);
    expect(status.maintenance.configured).toBe(true);
  });
});
