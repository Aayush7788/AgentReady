import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isBlockedDomain } from "@/lib/blocked-domains";
import { inferCategory } from "@/lib/categorize";
import { detectDocsProvider, detectDocsUrl } from "@/lib/docs-detection";
import { getSupabaseStatus } from "@/lib/env";
import {
  assertPublicHttpUrl,
  privateScanSlug,
  withSafeOutboundFetch,
} from "@/lib/outbound-security";
import { enforceRateLimit } from "@/lib/rate-limit";
import { AFDOCS_VERSION, runAgentReadinessScan } from "@/lib/scoring";
import { displayNameFromUrl, normalizeDocsUrl } from "@/lib/slug";
import {
  createScoreJob,
  getActiveScoreJobByDocsUrl,
  getScoreByDocsUrl,
  updateScoreJob,
  upsertScore,
} from "@/lib/supabase";
import type { CompanyScore, ScoreJobState } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 60 * 60;

interface ScoreRequestBody {
  url?: unknown;
}

function jobPath(jobId: string): string {
  return join(tmpdir(), `agentready-score-${jobId}.json`);
}

function removeLocalJob(jobId: string): void {
  try {
    unlinkSync(jobPath(jobId));
  } catch {
    // The local file is only a same-instance optimization.
  }
}

async function writeJob(jobId: string, state: ScoreJobState): Promise<void> {
  try {
    writeFileSync(jobPath(jobId), JSON.stringify(state), "utf-8");
  } catch (error) {
    console.error("[score] failed to write job state", error);
  }

  try {
    if (state.status === "running") {
      return;
    }
    await updateScoreJob(jobId, state);
  } catch (error) {
    console.warn(
      "[score] persistent job state unavailable",
      error instanceof Error ? error.message : error,
    );
  }
}

function withTimeout<T>(
  work: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();
  const promise = work(controller.signal);

  return Promise.race([
    promise.finally(() => {
      if (timeout) clearTimeout(timeout);
    }),
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new Error("Scoring timed out. The docs site may be slow or blocking automated requests."));
      }, ms);
    }),
  ]);
}

async function runScoreJob(input: {
  jobId: string;
  url: string;
  slug: string;
  name: string;
  category?: string;
  hidden?: boolean;
  docsProvider?: string | null;
}): Promise<void> {
  try {
    const timeoutMs = process.env.NODE_ENV === "development" ? 180_000 : 120_000;
    const { report, breakdown } = await withTimeout(
      (signal) =>
        withSafeOutboundFetch(
          () => runAgentReadinessScan(input.url),
          signal,
        ),
      timeoutMs,
    );
    const category = input.category ?? inferCategory(input.url, input.name);
    const provider = input.docsProvider ?? detectDocsProvider(input.url);

    const score: CompanyScore = {
      name: input.name,
      slug: input.slug,
      category,
      docsUrl: input.url,
      score: breakdown.score,
      grade: breakdown.grade,
      scoredAt: new Date().toISOString(),
      checks: breakdown.checks,
      results: report.results,
      categoryScores: breakdown.categoryScores,
      afdocsVersion: AFDOCS_VERSION,
      hidden: input.hidden,
      docsProvider: provider,
      platformDetected: provider,
    };

    await upsertScore(score);

    await writeJob(input.jobId, {
      status: "complete",
      slug: score.slug,
      score: score.score,
      grade: score.grade,
      summary: score.checks,
      results: score.results,
      company: score,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scoring failed.";
    await writeJob(input.jobId, {
      status: "error",
      message,
      isTimeout: message.toLowerCase().includes("timed out"),
    });
  }
}

export async function POST(request: Request) {
  let body: ScoreRequestBody;

  try {
    body = (await request.json()) as ScoreRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json", message: "Request body must be JSON." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? normalizeDocsUrl(body.url) : null;
  if (!url) {
    return NextResponse.json({ error: "invalid_url", message: "Please provide a valid public docs URL." }, { status: 400 });
  }

  if (isBlockedDomain(url)) {
    return NextResponse.json({ error: "blocked", message: "This domain is not eligible for scoring." }, { status: 403 });
  }

  const supabaseStatus = getSupabaseStatus();
  if (!supabaseStatus.configured) {
    return NextResponse.json(
      {
        error: "setup_required",
        message: `Missing Supabase configuration: ${supabaseStatus.missing.join(", ")}.`,
        missing: supabaseStatus.missing,
      },
      { status: 503 },
    );
  }

  let rateLimit;
  try {
    rateLimit = await enforceRateLimit(
      request,
      "documentation_scan",
      RATE_LIMIT,
      RATE_WINDOW_SECONDS,
    );
  } catch (error) {
    console.error(
      "[score] durable rate limit unavailable",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        error: "rate_limit_unavailable",
        message: "Scanning is temporarily unavailable. Please try again later.",
      },
      { status: 503 },
    );
  }
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: `You can run ${RATE_LIMIT} scans per hour.` },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(
              1,
              Math.ceil(
                (new Date(rateLimit.resetAt).getTime() - Date.now()) / 1_000,
              ),
            ),
          ),
        },
      },
    );
  }

  try {
    await assertPublicHttpUrl(url);
  } catch (error) {
    return NextResponse.json(
      {
        error: "unsafe_url",
        message:
          error instanceof Error
            ? error.message
            : "This documentation URL cannot be scanned.",
      },
      { status: 403 },
    );
  }

  const name = displayNameFromUrl(url);
  const slug = privateScanSlug(url);

  try {
    const existing = await getScoreByDocsUrl(url);
    if (existing) {
      if (existing.hidden) {
        const jobId = crypto.randomUUID();
        await createScoreJob(jobId, existing.slug, existing.docsUrl);
        await updateScoreJob(jobId, {
          status: "complete",
          slug: existing.slug,
          score: existing.score,
          grade: existing.grade,
          summary: existing.checks,
          results: existing.results,
          company: existing,
        });
        return NextResponse.json({
          jobId,
          slug: existing.slug,
          cached: true,
        });
      }
      return NextResponse.json({ existing: true, slug: existing.slug });
    }
  } catch (error) {
    console.warn("[score] cache lookup skipped", error instanceof Error ? error.message : error);
  }

  try {
    const activeJobId = await getActiveScoreJobByDocsUrl(url);
    if (activeJobId) {
      return NextResponse.json({ jobId: activeJobId, slug, deduplicated: true });
    }
  } catch (error) {
    console.warn(
      "[score] active job lookup skipped",
      error instanceof Error ? error.message : error,
    );
  }

  let docsProvider = detectDocsProvider(url);
  let detection;
  try {
    detection = await withSafeOutboundFetch(() => detectDocsUrl(url));
  } catch (error) {
    console.warn(
      "[score] documentation detection failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        error: "docs_unavailable",
        message:
          "The documentation site could not be inspected. Check the URL and try again.",
      },
      { status: 502 },
    );
  }
  docsProvider = detection.docsProvider ?? docsProvider;
  if (!detection.isLikely) {
    return NextResponse.json(
      {
        error: "not_docs",
        message: detection.warning,
        suggestion: detection.suggestion,
      },
      { status: 422 },
    );
  }

  const jobId = crypto.randomUUID();
  await writeJob(jobId, { status: "running" });
  try {
    await createScoreJob(jobId, slug, url);
  } catch (error) {
    removeLocalJob(jobId);
    console.error(
      "[score] persistent job creation failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        error: "scan_unavailable",
        message: "The scan could not be started. Please try again later.",
      },
      { status: 503 },
    );
  }

  const task = runScoreJob({
    jobId,
    url,
    slug,
    name,
    hidden: true,
    docsProvider,
  });

  if (process.env.NODE_ENV === "development") {
    task.catch((error) => console.error("[score] background scan failed", error));
  } else {
    waitUntil(task);
  }

  return NextResponse.json({ jobId, slug });
}
