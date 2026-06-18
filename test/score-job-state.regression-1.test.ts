import { describe, expect, it } from "vitest";
import { preferTerminalJobState } from "@/lib/score-jobs";
import type { ScoreJobState } from "@/lib/types";

const completeState = {
  status: "complete",
  slug: "example",
  score: 90,
  grade: "A",
  summary: {
    total: 23,
    pass: 20,
    warn: 1,
    fail: 1,
    skip: 1,
    error: 0,
  },
} satisfies ScoreJobState;

// Regression: ISSUE-006 - stale running state could hide a completed local scan
// Found by /qa on 2026-06-18
// Report: .gstack/qa-reports/qa-report-localhost-2026-06-18.md
describe("score job state resolution", () => {
  it("prefers a terminal local state over stale durable running state", () => {
    expect(
      preferTerminalJobState(completeState, { status: "running" }),
    ).toEqual(completeState);
  });

  it("prefers a terminal durable state over stale local running state", () => {
    expect(
      preferTerminalJobState({ status: "running" }, completeState),
    ).toEqual(completeState);
  });
});
