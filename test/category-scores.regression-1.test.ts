import { describe, expect, it } from "vitest";
import { normalizeCategoryScores } from "@/lib/scoring";

// Regression: ISSUE-005 - not-applicable category scores rendered as zero
// Found by /qa on 2026-06-18
// Report: .gstack/qa-reports/qa-report-localhost-2026-06-18.md
describe("AFDocs category score normalization", () => {
  it("preserves null scores as not applicable", () => {
    expect(
      normalizeCategoryScores({
        "content-discoverability": { score: 95 },
        "markdown-availability": { score: null },
      }),
    ).toEqual({
      "content-discoverability": 95,
      "markdown-availability": null,
    });
  });
});
