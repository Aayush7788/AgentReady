import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().min(1).optional(),
  VERCEL_URL: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(24).optional(),
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
    VERCEL_PROJECT_PRODUCTION_URL:
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
  });
}

export function getSiteUrl(): string {
  const env = readEnv();
  const vercelHost =
    env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL;
  const explicitUrl = env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const explicitIsLocal =
    explicitUrl === "http://localhost:3000" ||
    explicitUrl === "http://127.0.0.1:3000";

  if (explicitUrl && (!explicitIsLocal || !vercelHost)) {
    return explicitUrl;
  }

  return vercelHost ? `https://${vercelHost}` : "http://localhost:3000";
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

export function getCronSecret(): string | null {
  return readEnv().CRON_SECRET ?? null;
}

export function getMaintenanceStatus(): {
  configured: boolean;
  missing: string[];
} {
  const configured = getCronSecret() !== null;
  return {
    configured,
    missing: configured ? [] : ["CRON_SECRET"],
  };
}

export function isConfigurationError(error: unknown): error is ConfigurationError {
  return error instanceof ConfigurationError;
}
