import { NextResponse } from "next/server";
import { toApiError } from "@/lib/api-errors";
import { getPublicLeaderboard } from "@/lib/public-scores";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;
    const leaderboard = await getPublicLeaderboard(category);
    return NextResponse.json(leaderboard);
  } catch (error) {
    const apiError = toApiError(error, {
      error: "leaderboard_unavailable",
      message: "Could not load leaderboard.",
    });
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}
