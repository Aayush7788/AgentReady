import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { preferTerminalJobState } from "@/lib/score-jobs";
import { getScoreJob } from "@/lib/supabase";
import type { ScoreJobState } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const;

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) {
    return NextResponse.json(
      { error: "invalid_job", message: "The scan job identifier is invalid." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const localState = readJob(jobId);
  let durableState: ScoreJobState | null = null;
  try {
    durableState = await getScoreJob(jobId);
  } catch {
    durableState = null;
  }
  const state = preferTerminalJobState(localState, durableState);

  if (state?.status === "complete" || state?.status === "error") {
    return NextResponse.json(state, { headers: NO_STORE_HEADERS });
  }

  if (state?.status === "running") {
    return NextResponse.json(
      { status: "running" },
      { headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(
    { error: "job_not_found", message: "This scan job was not found or has expired." },
    { status: 404, headers: NO_STORE_HEADERS },
  );
}
