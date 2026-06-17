import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getScoreBySlug } from "@/lib/supabase";
import type { ScoreJobState } from "@/lib/types";

export const runtime = "nodejs";

function jobPath(jobId: string): string {
  return join(tmpdir(), `agentready-score-${jobId}.json`);
}

function readJob(jobId: string): ScoreJobState | null {
  try {
    return JSON.parse(readFileSync(jobPath(jobId), "utf-8")) as ScoreJobState;
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  const state = readJob(params.jobId);
  if (state?.status === "complete" || state?.status === "error") {
    return NextResponse.json(state);
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const since = Number(searchParams.get("since") ?? "0");

  if (slug && process.env.NODE_ENV !== "development") {
    try {
      const score = await getScoreBySlug(slug, { includeHidden: true });
      if (score && (!Number.isFinite(since) || new Date(score.scoredAt).getTime() > since)) {
        return NextResponse.json({
          status: "complete",
          slug: score.slug,
          score: score.score,
          grade: score.grade,
          summary: score.checks,
          results: score.results,
        });
      }
    } catch {
      return NextResponse.json({ status: "running" });
    }
  }

  return NextResponse.json({ status: "running" });
}

