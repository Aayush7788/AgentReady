import { getLeaderboardScores, getScoreBySlug } from "./supabase";
import { toGrade } from "./scoring";
import type { CompanyScore } from "./types";

export async function getCompanyScore(slug: string): Promise<CompanyScore | null> {
  return getScoreBySlug(slug);
}

export async function getLeaderboard(category?: string): Promise<CompanyScore[]> {
  const scores = await getLeaderboardScores(category);
  return scores.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function calculateGrade(score: number): CompanyScore["grade"] {
  return toGrade(score);
}
