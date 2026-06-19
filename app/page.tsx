import { HomePage } from "@/frontend/components/home-page";
import type { LeaderboardCompany } from "@/frontend/components/leaderboard-table";
import { getPublicLeaderboard } from "@/lib/public-scores";

export const revalidate = 300;

async function loadLeaderboard(): Promise<LeaderboardCompany[]> {
  const scores = await getPublicLeaderboard();
  return scores.map(
    ({ results: _results, categoryScores: _categoryScores, ...score }) => score,
  );
}

export default async function Home() {
  return <HomePage companies={await loadLeaderboard()} />;
}
