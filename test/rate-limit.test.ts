import { afterEach, describe, expect, it, vi } from "vitest";

const consumeRequestLimit = vi.fn().mockResolvedValue({
  allowed: true,
  remaining: 4,
  resetAt: new Date(Date.now() + 60_000).toISOString(),
});

vi.mock("@/lib/supabase", () => ({
  consumeRequestLimit,
}));

describe("request rate limiting", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("bypasses persistent limits for local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { enforceRateLimit } = await import("@/lib/rate-limit");

    const result = await enforceRateLimit(
      new Request("http://localhost:3000/api/score"),
      "scan",
      5,
      3600,
    );

    expect(result.allowed).toBe(true);
    expect(consumeRequestLimit).not.toHaveBeenCalled();
  });

  it("does not trust a localhost host header in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      "test-service-role-key-for-rate-limit",
    );
    const { enforceRateLimit } = await import("@/lib/rate-limit");

    await enforceRateLimit(
      new Request("https://localhost/api/score", {
        headers: {
          "x-forwarded-for": "203.0.113.10",
          "user-agent": "test",
        },
      }),
      "scan",
      5,
      3600,
    );

    expect(consumeRequestLimit).toHaveBeenCalledOnce();
  });
});
