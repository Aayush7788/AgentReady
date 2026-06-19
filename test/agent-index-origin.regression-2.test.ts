import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CompanyScore } from "@/lib/types";

const getPublicLeaderboard = vi.fn();

vi.mock("@/lib/public-scores", () => ({
  getPublicLeaderboard,
}));

const originalEnv = { ...process.env };

const company = {
  name: "Example",
  slug: "example",
  category: "Developer Tools",
  docsUrl: "https://docs.example.com",
  score: 90,
  grade: "A",
  scoredAt: "2026-06-18T00:00:00.000Z",
  checks: {
    total: 23,
    pass: 20,
    warn: 1,
    fail: 1,
    skip: 1,
    error: 0,
  },
} satisfies CompanyScore;

beforeEach(() => {
  getPublicLeaderboard.mockResolvedValue([company]);
});

afterEach(() => {
  process.env = { ...originalEnv };
});

// Regression: production agent indexes must not publish localhost URLs.
describe("agent-readable index origin", () => {
  it("uses the production deployment URL when a local URL is still configured", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "agentready.vercel.app";

    const { GET } = await import("@/app/llms.txt/route");
    const response = await GET();
    const body = await response.text();

    expect(body).toContain(
      "https://agentready.vercel.app/companies/example.md",
    );
    expect(body).not.toContain("localhost");
  });
});
