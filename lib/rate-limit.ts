import { createHmac } from "node:crypto";
import { getSupabaseEnv } from "./env";
import { consumeRequestLimit } from "./supabase";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

function isLocalRequest(request: Request): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const host = request.headers.get("host") ?? new URL(request.url).host;
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

function requestIdentity(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return `${ip}|${userAgent}`;
}

export async function enforceRateLimit(
  request: Request,
  namespace: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (isLocalRequest(request)) {
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1_000).toISOString(),
    };
  }

  const { serviceRoleKey } = getSupabaseEnv();
  const identityHash = createHmac("sha256", serviceRoleKey)
    .update(requestIdentity(request))
    .digest("hex");

  return consumeRequestLimit(
    `${namespace}:${identityHash}`,
    limit,
    windowSeconds,
  );
}
