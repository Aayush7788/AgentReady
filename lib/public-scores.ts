import leaderboardSnapshot from "@/data/leaderboard-snapshot.json";
import { getCompanyScore, getLeaderboard } from "@/lib/scores";
import type { CompanyScore } from "@/lib/types";

const snapshot = leaderboardSnapshot as CompanyScore[];

function snapshotLeaderboard(category?: string): CompanyScore[] {
  const scores = category
    ? snapshot.filter((company) => company.category === category)
    : snapshot;

  return [...scores].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name),
  );
}

export async function getPublicLeaderboard(
  category?: string,
): Promise<CompanyScore[]> {
  try {
    const scores = await getLeaderboard(category);
    if (scores.length > 0) return scores;

    console.warn("[public-scores] live leaderboard is empty; using snapshot");
  } catch (error) {
    console.error(
      "[public-scores] live leaderboard unavailable; using snapshot",
      error instanceof Error ? error.message : error,
    );
  }

  return snapshotLeaderboard(category);
}

export async function getPublicCompanyScore(
  slug: string,
): Promise<CompanyScore | null> {
  try {
    const score = await getCompanyScore(slug);
    if (score) return score;
  } catch (error) {
    console.error(
      `[public-scores] live report unavailable for ${slug}; using snapshot`,
      error instanceof Error ? error.message : error,
    );
  }

  return snapshot.find((company) => company.slug === slug) ?? null;
}
