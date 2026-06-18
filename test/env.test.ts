import { afterEach, describe, expect, it } from "vitest";
import {
  getMaintenanceStatus,
  getSupabaseEnv,
  getSupabaseStatus,
} from "@/lib/env";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("Supabase environment helpers", () => {
  it("reports missing Supabase configuration without throwing", () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(getSupabaseStatus()).toEqual({
      configured: false,
      missing: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    });
  });

  it("throws a typed setup error when required values are missing", () => {
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";

    expect(() => getSupabaseEnv()).toThrow(/SUPABASE_URL/);
  });

  it("returns configured values when both Supabase variables exist", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";

    expect(getSupabaseStatus()).toEqual({ configured: true, missing: [] });
    expect(getSupabaseEnv()).toEqual({
      url: "https://example.supabase.co",
      serviceRoleKey: "service-role",
    });
  });

  it("reports maintenance configuration without exposing its value", () => {
    delete process.env.CRON_SECRET;
    expect(getMaintenanceStatus()).toEqual({
      configured: false,
      missing: ["CRON_SECRET"],
    });

    process.env.CRON_SECRET = "0123456789abcdef0123456789abcdef";
    expect(getMaintenanceStatus()).toEqual({
      configured: true,
      missing: [],
    });
  });
});
