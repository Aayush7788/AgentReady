import { describe, expect, it } from "vitest";
import { summarizeResults } from "@/lib/scoring";
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

