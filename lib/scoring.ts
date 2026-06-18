import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  computeScore as computeAfdocsScore,
  runChecks,
  toGrade,
  type CheckResult,
  type Grade,
  type ReportResult,
  type RunnerOptions,
} from "afdocs";
import type { ScoreBreakdown, ScoreCounts } from "./types";

export type { CheckResult, Grade, ReportResult, RunnerOptions };
export { toGrade };

export const AFDOCS_VERSION = readAfdocsVersion();

export const DEFAULT_SCAN_OPTIONS: Partial<RunnerOptions> = {
  requestTimeout: process.env.NODE_ENV === "development" ? 60_000 : 8_000,
  requestDelay: 0,
  maxConcurrency: 6,
  maxLinksToTest: 10,
};

function readAfdocsVersion(): string {
  try {
    const raw = readFileSync(join(process.cwd(), "node_modules", "afdocs", "package.json"), "utf-8");
    return JSON.parse(raw).version ?? "unknown";
  } catch {
    return "unknown";
  }
}

export function summarizeResults(results: CheckResult[]): ScoreCounts {
  return results.reduce<ScoreCounts>(
    (counts, result) => {
      counts.total += 1;
      if (result.status === "pass") counts.pass += 1;
      if (result.status === "warn") counts.warn += 1;
      if (result.status === "fail") counts.fail += 1;
      if (result.status === "skip") counts.skip += 1;
      if (result.status === "error") counts.error += 1;
      return counts;
    },
    { total: 0, pass: 0, warn: 0, fail: 0, skip: 0, error: 0 },
  );
}

export function normalizeCategoryScores(
  categoryScores: unknown,
): Record<string, number | null> {
  if (!categoryScores || typeof categoryScores !== "object") return {};

  return Object.fromEntries(
    Object.entries(categoryScores).map(([name, value]) => {
      if (typeof value === "number") return [name, value];
      if (value && typeof value === "object" && "score" in value) {
        const score = (value as { score: number | null }).score;
        return [name, score];
      }

      return [name, null];
    }),
  );
}

export function computeScoreBreakdown(report: ReportResult): ScoreBreakdown {
  const scored = computeAfdocsScore(report);

  return {
    score: Math.round(scored.overall),
    grade: scored.grade,
    cap: scored.cap,
    checks: summarizeResults(report.results),
    categoryScores: normalizeCategoryScores(scored.categoryScores),
  };
}

export async function runAgentReadinessScan(
  url: string,
  options: Partial<RunnerOptions> = {},
): Promise<{ report: ReportResult; breakdown: ScoreBreakdown }> {
  const report = await runChecks(url, { ...DEFAULT_SCAN_OPTIONS, ...options });
  return {
    report,
    breakdown: computeScoreBreakdown(report),
  };
}
