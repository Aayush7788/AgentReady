import type { CheckResult, Grade, ScoreCap } from "afdocs";

export type AgentReadyGrade = Grade;
export type AgentReadyCheckResult = CheckResult;

export interface ScoreCounts {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  skip: number;
  error: number;
}

export interface CompanyScore {
  name: string;
  slug: string;
  category: string;
  docsUrl: string;
  score: number;
  grade: AgentReadyGrade;
  scoredAt: string;
  checks: ScoreCounts;
  results?: AgentReadyCheckResult[];
  categoryScores?: Record<string, number | null>;
  afdocsVersion?: string;
  hidden?: boolean;
  docsProvider?: string | null;
  platformDetected?: string | null;
}

export interface ScoreBreakdown {
  score: number;
  grade: AgentReadyGrade;
  cap?: ScoreCap;
  checks: ScoreCounts;
  categoryScores: Record<string, number | null>;
}

export type ScoreJobState =
  | { status: "running" }
  | {
      status: "complete";
      slug: string;
      score: number;
      grade: AgentReadyGrade;
      summary: ScoreCounts;
      results?: AgentReadyCheckResult[];
      company?: CompanyScore;
    }
  | { status: "error"; message: string; isTimeout?: boolean };
