import { getAllScores, getScoreBySlug } from "./supabase";
import type { CompanyScore } from "./types";

export async function getCompanyScore(slug: string): Promise<CompanyScore | null> {
  return getScoreBySlug(slug);
}

export async function getLeaderboard(category?: string): Promise<CompanyScore[]> {
  const scores = await getAllScores({ category });
  return scores.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function calculateGrade(score: number): CompanyScore["grade"] {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

