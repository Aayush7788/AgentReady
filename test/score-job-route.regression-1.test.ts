import { describe, expect, it } from "vitest";
import { dynamic, revalidate } from "@/app/api/score/[jobId]/route";

// Regression: ISSUE-001 - completed scans stayed on the loading screen
// Found by /qa on 2026-06-18
// Report: .gstack/qa-reports/qa-report-localhost-2026-06-18.md
describe("score job status route cache policy", () => {
  it("disables route caching so polling can observe terminal job states", () => {
    expect(dynamic).toBe("force-dynamic");
    expect(revalidate).toBe(0);
  });
});
