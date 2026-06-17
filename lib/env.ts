import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export class ConfigurationError extends Error {
  readonly code = "setup_required";
  readonly missing: string[];

  constructor(message: string, missing: string[]) {
    super(message);
    this.name = "ConfigurationError";
    this.missing = missing;
  }
}

export function readEnv() {
  return envSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

export function getSiteUrl(): string {
  return readEnv().NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function getSupabaseStatus(): {
  configured: boolean;
  missing: string[];
} {
  const env = readEnv();
  const missing: string[] = [];

  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  return {
    configured: missing.length === 0,
    missing,
  };
}

export function getSupabaseEnv(): {
  url: string;
  serviceRoleKey: string;
} {
  const env = readEnv();
  const status = getSupabaseStatus();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new ConfigurationError(
      `Missing Supabase configuration: ${status.missing.join(", ")}.`,
      status.missing,
    );
  }

  return {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function isConfigurationError(error: unknown): error is ConfigurationError {
  return error instanceof ConfigurationError;
}
