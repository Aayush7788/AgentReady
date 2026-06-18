import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompanyScore } from "@/lib/types";

const getCompanyScore = vi.fn();
const getLeaderboard = vi.fn();

vi.mock("@/lib/scores", () => ({
  getCompanyScore,
  getLeaderboard,
}));

const report = {
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
  results: [],
  categoryScores: {},
} satisfies CompanyScore;

beforeEach(() => {
  getCompanyScore.mockReset();
  getLeaderboard.mockReset();
});

// Regression: ISSUE-003 - company Markdown routes returned homepage Markdown
// Found by /qa on 2026-06-18
// Report: .gstack/qa-reports/qa-report-localhost-2026-06-18.md
describe("agent-readable Markdown routing", () => {
  it("uses the original path forwarded by middleware", async () => {
    getCompanyScore.mockResolvedValue(report);
    const { GET } = await import("@/app/api/markdown/route");
    const response = await GET(
      new Request("http://localhost/api/markdown", {
        headers: {
          "x-agentready-markdown-path": "/companies/example",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain(
      "# Example documentation readiness",
    );
    expect(getCompanyScore).toHaveBeenCalledWith("example");
  });

  it("returns a real 404 for an unknown company report", async () => {
    getCompanyScore.mockResolvedValue(null);
    const { GET } = await import("@/app/api/markdown/route");
    const response = await GET(
      new Request("http://localhost/api/markdown", {
        headers: {
          "x-agentready-markdown-path": "/companies/missing",
        },
      }),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
