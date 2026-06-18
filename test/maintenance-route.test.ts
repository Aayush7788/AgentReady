import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runDataMaintenance = vi.fn();

vi.mock("@/lib/maintenance", () => ({
  runDataMaintenance,
}));

describe("maintenance cleanup route", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "0123456789abcdef0123456789abcdef");
    runDataMaintenance.mockResolvedValue({
      scoreJobs: 1,
      privateScores: 2,
      contactRequests: 3,
      requestLimits: 4,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("rejects requests without the cron bearer secret", async () => {
    const { GET } = await import("@/app/api/maintenance/cleanup/route");
    const response = await GET(
      new Request("https://agentready.vercel.app/api/maintenance/cleanup"),
    );

    expect(response.status).toBe(401);
    expect(runDataMaintenance).not.toHaveBeenCalled();
  });

  it("runs cleanup for an authorized cron request", async () => {
    const { GET } = await import("@/app/api/maintenance/cleanup/route");
    const response = await GET(
      new Request("https://agentready.vercel.app/api/maintenance/cleanup", {
        headers: {
          Authorization: "Bearer 0123456789abcdef0123456789abcdef",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "complete",
      removed: {
        scoreJobs: 1,
        privateScores: 2,
        contactRequests: 3,
        requestLimits: 4,
      },
    });
  });
});
