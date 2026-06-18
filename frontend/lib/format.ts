import type { AgentReadyCheckResult, AgentReadyGrade } from "@/lib/types";

export function formatScoreDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
export function formatReportDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function docsLabel(docsUrl: string): string {
  const url = new URL(docsUrl);
  return `${url.host}${url.pathname === "/" ? "" : url.pathname}`.replace(/\/$/, "");
}

export function gradeClass(grade: AgentReadyGrade): string {
  return grade.toLowerCase().replace("+", "-plus");
}

const statusOrder: Record<AgentReadyCheckResult["status"], number> = {
  fail: 0,
  error: 1,
  warn: 2,
  skip: 3,
  pass: 4,
};

export function sortCheckResults(
  results: AgentReadyCheckResult[] = [],
): AgentReadyCheckResult[] {
  return [...results].sort(
    (left, right) =>
      statusOrder[left.status] - statusOrder[right.status] ||
      left.category.localeCompare(right.category) ||
      left.id.localeCompare(right.id),
  );
}
