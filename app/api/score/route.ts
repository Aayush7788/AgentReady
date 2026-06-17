import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isBlockedDomain } from "@/lib/blocked-domains";
import { inferCategory } from "@/lib/categorize";
import { detectDocsProvider, detectDocsUrl } from "@/lib/docs-detection";
import { getSupabaseStatus } from "@/lib/env";
import { AFDOCS_VERSION, runAgentReadinessScan } from "@/lib/scoring";
import { displayNameFromUrl, nameToSlug, normalizeDocsUrl, urlToSlug } from "@/lib/slug";
import { getScoreBySlug, upsertScore } from "@/lib/supabase";
import type { CompanyScore, ScoreJobState } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_COOKIE = "agentready_scan_rl";
const ipHits = new Map<string, number[]>();

interface ScoreRequestBody {
  url?: unknown;
  name?: unknown;
  slug?: unknown;
  category?: unknown;
  force?: unknown;
  skipDetection?: unknown;
}

function jobPath(jobId: string): string {
  return join(tmpdir(), `agentready-score-${jobId}.json`);
}

function writeJob(jobId: string, state: ScoreJobState): void {
  try {
    writeFileSync(jobPath(jobId), JSON.stringify(state), "utf-8");
  } catch (error) {
    console.error("[score] failed to write job state", error);
  }
}

function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return undefined;
  return trimmed;
}

function getCookieTimestamps(request: Request): number[] {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${RATE_COOKIE}=([^;]+)`));
  if (!match) return [];

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter((item) => typeof item === "number" && now - item < RATE_WINDOW_MS);
  } catch {
    return [];
  }
}

function buildRateLimitCookie(timestamps: number[]): string {
  const next = encodeURIComponent(JSON.stringify([...timestamps, Date.now()]));
  return `${RATE_COOKIE}=${next}; Path=/; Max-Age=3600; HttpOnly; SameSite=Strict`;
}

function checkIpRateLimit(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  if (ip === "unknown") return true;

  const now = Date.now();
  const recent = (ipHits.get(ip) ?? []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;

  ipHits.set(ip, [...recent, now]);
  if (ipHits.size > 5_000) {
    const cutoff = now - RATE_WINDOW_MS;
    for (const [key, hits] of Array.from(ipHits.entries())) {
      if (hits.every((timestamp) => timestamp < cutoff)) ipHits.delete(key);
    }
  }

  return true;
}

function isLocalRequest(request: Request): boolean {
  const host = request.headers.get("host") ?? "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    promise.finally(() => {
      if (timeout) clearTimeout(timeout);
    }),
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
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
    const { report, breakdown } = await withTimeout(runAgentReadinessScan(input.url), timeoutMs);
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

    writeJob(input.jobId, {
      status: "complete",
      slug: score.slug,
      score: score.score,
      grade: score.grade,
      summary: score.checks,
      results: score.results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scoring failed.";
    writeJob(input.jobId, {
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

  let rateTimestamps: number[] = [];
  if (!isLocalRequest(request)) {
    rateTimestamps = getCookieTimestamps(request);
    if (rateTimestamps.length >= RATE_LIMIT || !checkIpRateLimit(request)) {
      return NextResponse.json(
        { error: "rate_limited", message: `You can run ${RATE_LIMIT} scans per hour.` },
        { status: 429 },
      );
    }
  }

  const name = cleanText(body.name, 120) ?? displayNameFromUrl(url);
  const requestedSlug = cleanText(body.slug, 100);
  const slug = requestedSlug ? nameToSlug(requestedSlug) : nameToSlug(name) || urlToSlug(url);
  const category = cleanText(body.category, 80);
  const force = body.force === true;
  const skipDetection = process.env.NODE_ENV === "development" && body.skipDetection === true;

  if (!force) {
    try {
      const existing = await getScoreBySlug(slug, { includeHidden: true });
      if (existing) {
        return NextResponse.json({ existing: true, slug: existing.slug });
      }
    } catch (error) {
      console.warn("[score] cache lookup skipped", error instanceof Error ? error.message : error);
    }
  }

  let docsProvider = detectDocsProvider(url);
  if (!skipDetection) {
    const detection = await detectDocsUrl(url);
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
  }

  const jobId = crypto.randomUUID();
  writeJob(jobId, { status: "running" });

  const hidden = force ? undefined : true;
  const task = runScoreJob({ jobId, url, slug, name, category, hidden, docsProvider });

  if (process.env.NODE_ENV === "development") {
    task.catch((error) => console.error("[score] background scan failed", error));
  } else {
    waitUntil(task);
  }

  const response = NextResponse.json({ jobId, slug });
  if (!isLocalRequest(request)) {
    response.headers.set("Set-Cookie", buildRateLimitCookie(rateTimestamps));
  }

  return response;
}
