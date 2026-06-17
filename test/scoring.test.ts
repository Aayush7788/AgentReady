import { describe, expect, it } from "vitest";
import { summarizeResults } from "@/lib/scoring";
import { calculateGrade } from "@/lib/scores";
import type { CheckResult } from "afdocs";

describe("summarizeResults", () => {
  it("counts every AFDocs status", () => {
    const results = [
      { id: "a", category: "one", status: "pass", message: "ok" },
      { id: "b", category: "one", status: "warn", message: "warning" },
      { id: "c", category: "two", status: "fail", message: "bad" },
      { id: "d", category: "two", status: "skip", message: "skip" },
      { id: "e", category: "two", status: "error", message: "error" },
    ] satisfies CheckResult[];

    expect(summarizeResults(results)).toEqual({
      total: 5,
      pass: 1,
      warn: 1,
      fail: 1,
      skip: 1,
      error: 1,
    });
  });
});

describe("calculateGrade", () => {
  it("uses the same grade thresholds as the scoring engine", () => {
    expect(calculateGrade(100)).toBe("A+");
    expect(calculateGrade(90)).toBe("A");
    expect(calculateGrade(80)).toBe("B");
    expect(calculateGrade(70)).toBe("C");
    expect(calculateGrade(60)).toBe("D");
    expect(calculateGrade(59)).toBe("F");
  });
});
