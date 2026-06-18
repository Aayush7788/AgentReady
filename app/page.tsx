import leaderboardSnapshot from "@/data/leaderboard-snapshot.json";
import { HomePage } from "@/frontend/components/home-page";
import type { LeaderboardCompany } from "@/frontend/components/leaderboard-table";
import { getLeaderboard } from "@/lib/scores";

export const revalidate = 300;

async function loadLeaderboard(): Promise<LeaderboardCompany[]> {
  try {
    const scores = await getLeaderboard();
    return scores.map(({ results: _results, categoryScores: _categoryScores, ...score }) => score);
  } catch (error) {
    console.error(
      "[home] live leaderboard unavailable; using snapshot",
      error instanceof Error ? error.message : error,
    );
    return leaderboardSnapshot as LeaderboardCompany[];
  }
}

export default async function Home() {
  return <HomePage companies={await loadLeaderboard()} />;
}
