import { describe, expect, it } from "vitest";
import { LEADERBOARD_SELECT_COLUMNS } from "@/lib/supabase";

// Regression: ISSUE-004 - the 25-row leaderboard downloaded full report JSON
// Found by /qa on 2026-06-18
// Report: .gstack/qa-reports/qa-report-localhost-2026-06-18.md
describe("leaderboard query projection", () => {
  it("excludes large per-check report fields", () => {
    const columns = LEADERBOARD_SELECT_COLUMNS.split(",");

    expect(columns).not.toContain("results");
    expect(columns).not.toContain("category_scores");
    expect(columns).toContain("score");
    expect(columns).toContain("checks_pass");
  });
});
