import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";
import type { ContactRequestInput } from "./contact";
import type { CompanyScore, ScoreJobState } from "./types";

export interface ScoreRow {
  id?: string;
  slug: string;
  name: string;
  category: string;
  docs_url: string;
  score: number;
  grade: CompanyScore["grade"];
  scored_at: string;
  checks_total: number;
  checks_pass: number;
  checks_warn: number;
  checks_fail: number;
  checks_skip: number | null;
  checks_error: number | null;
  results: CompanyScore["results"] | null;
  category_scores: Record<string, number | null> | null;
  afdocs_version: string | null;
  hidden: boolean | null;
  docs_provider: string | null;
  platform_detected: string | null;
}

export interface ContactRequestRow {
  id: string;
  work_email: string;
  docs_url: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "closed";
  created_at: string;
  updated_at: string;
}

export interface DataCleanupResult {
  scoreJobs: number;
  privateScores: number;
  contactRequests: number;
  requestLimits: number;
}

export const LEADERBOARD_SELECT_COLUMNS = [
  "slug",
  "name",
  "category",
  "docs_url",
  "score",
  "grade",
  "scored_at",
  "checks_total",
  "checks_pass",
  "checks_warn",
  "checks_fail",
  "checks_skip",
  "checks_error",
  "afdocs_version",
  "hidden",
  "docs_provider",
  "platform_detected",
].join(",");

type ScoreSummaryRow = Omit<ScoreRow, "results" | "category_scores">;

type ScoreInsert = Omit<
  ScoreRow,
  "id" | "hidden" | "results" | "category_scores" | "afdocs_version" | "docs_provider" | "platform_detected"
> & {
  id?: string;
  hidden?: boolean | null;
  results?: CompanyScore["results"] | null;
  category_scores?: Record<string, number | null> | null;
  afdocs_version?: string | null;
  docs_provider?: string | null;
  platform_detected?: string | null;
};

// Supabase's generated types should replace this untyped client once the project
// has a linked Supabase project and generated Database type.
type SupabaseAdminClient = ReturnType<typeof createClient<any>>;

let cachedClient: SupabaseAdminClient | null = null;
const INTERNAL_BUCKET = "agentready-internal";
const STALE_JOB_MS = 6 * 60 * 1_000;
let bucketReady: Promise<void> | null = null;

function getSupabaseAdmin(): SupabaseAdminClient {
  if (!cachedClient) {
    const env = getSupabaseEnv();
    cachedClient = createClient(env.url, env.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}

function isMissingRelation(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205";
}

async function ensureInternalBucket(): Promise<void> {
  if (bucketReady) return bucketReady;

  bucketReady = (async () => {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage.getBucket(INTERNAL_BUCKET);
    if (data && !error) return;

    const { error: createError } = await admin.storage.createBucket(INTERNAL_BUCKET, {
      public: false,
      fileSizeLimit: 1_048_576,
      allowedMimeTypes: ["application/json"],
    });
    if (createError && !createError.message.toLowerCase().includes("already exists")) {
      throw new Error(`Supabase internal bucket creation failed: ${createError.message}`);
    }
  })();

  return bucketReady;
}

async function writeInternalJson(path: string, value: unknown): Promise<void> {
  await ensureInternalBucket();
  const { error } = await getSupabaseAdmin().storage
    .from(INTERNAL_BUCKET)
    .upload(path, JSON.stringify(value), {
      contentType: "application/json",
      upsert: true,
    });
  if (error) {
    throw new Error(`Supabase internal storage write failed: ${error.message}`);
  }
}

async function readInternalJson<T>(path: string): Promise<T | null> {
  await ensureInternalBucket();
  const { data, error } = await getSupabaseAdmin().storage
    .from(INTERNAL_BUCKET)
    .download(path);
  if (error) {
    if (error.message.toLowerCase().includes("not found")) return null;
    throw new Error(`Supabase internal storage read failed: ${error.message}`);
  }
  return JSON.parse(await data.text()) as T;
}

async function removeInternalFile(path: string): Promise<void> {
  await ensureInternalBucket();
  const { error } = await getSupabaseAdmin().storage
    .from(INTERNAL_BUCKET)
    .remove([path]);
  if (error) {
    throw new Error(`Supabase internal storage cleanup failed: ${error.message}`);
  }
}

export function rowToCompanyScore(row: ScoreRow): CompanyScore {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    docsUrl: row.docs_url,
    score: row.score,
    grade: row.grade,
    scoredAt: row.scored_at,
    checks: {
      total: row.checks_total,
      pass: row.checks_pass,
      warn: row.checks_warn,
      fail: row.checks_fail,
      skip: row.checks_skip ?? 0,
      error: row.checks_error ?? 0,
    },
    results: row.results ?? undefined,
    categoryScores: row.category_scores ?? undefined,
    afdocsVersion: row.afdocs_version ?? undefined,
    hidden: row.hidden ?? false,
    docsProvider: row.docs_provider,
    platformDetected: row.platform_detected,
  };
}

export async function upsertScore(score: CompanyScore): Promise<void> {
  const payload: ScoreInsert = {
    slug: score.slug,
    name: score.name,
    category: score.category,
    docs_url: score.docsUrl,
    score: score.score,
    grade: score.grade,
    scored_at: score.scoredAt,
    checks_total: score.checks.total,
    checks_pass: score.checks.pass,
    checks_warn: score.checks.warn,
    checks_fail: score.checks.fail,
    checks_skip: score.checks.skip,
    checks_error: score.checks.error,
    results: score.results ?? null,
    category_scores: score.categoryScores ?? null,
    afdocs_version: score.afdocsVersion ?? null,
    docs_provider: score.docsProvider ?? null,
    platform_detected: score.platformDetected ?? null,
  };

  if (score.hidden !== undefined) {
    payload.hidden = score.hidden;
  }

  const { error } = await getSupabaseAdmin()
    .from("scores")
    .upsert(payload, { onConflict: "slug" });

  if (error) {
    throw new Error(`Supabase score upsert failed: ${error.message}`);
  }
}

export async function getScoreBySlug(
  slug: string,
  options: { includeHidden?: boolean } = {},
): Promise<CompanyScore | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("scores")
    .select("*")
    .eq("slug", slug)
    .order("scored_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Supabase score lookup failed: ${error.message}`);
  }

  const row = data?.[0] as ScoreRow | undefined;
  if (!row) return null;
  if (row.hidden && !options.includeHidden) return null;
  return rowToCompanyScore(row);
}

export async function getAllScores(
  options: { includeHidden?: boolean; category?: string } = {},
): Promise<CompanyScore[]> {
  let query = getSupabaseAdmin()
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .order("scored_at", { ascending: false })
    .limit(10_000);

  if (!options.includeHidden) {
    query = query.eq("hidden", false);
  }

  if (options.category) {
    query = query.ilike("category", options.category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Supabase leaderboard lookup failed: ${error.message}`);
  }

  return ((data ?? []) as ScoreRow[]).map(rowToCompanyScore);
}

export async function getLeaderboardScores(
  category?: string,
): Promise<CompanyScore[]> {
  let query = getSupabaseAdmin()
    .from("scores")
    .select(LEADERBOARD_SELECT_COLUMNS)
    .eq("hidden", false)
    .order("score", { ascending: false })
    .order("scored_at", { ascending: false })
    .limit(100);

  if (category) {
    query = query.ilike("category", category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Supabase leaderboard lookup failed: ${error.message}`);
  }

  return ((data ?? []) as unknown as ScoreSummaryRow[]).map((row) =>
    rowToCompanyScore({
      ...row,
      results: null,
      category_scores: null,
    }),
  );
}

export async function setScoreVisibility(
  slug: string,
  hidden: boolean,
): Promise<CompanyScore | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("scores")
    .update({ hidden })
    .eq("slug", slug)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase visibility update failed: ${error.message}`);
  }

  return data ? rowToCompanyScore(data as ScoreRow) : null;
}

export async function getScoreByDocsUrl(docsUrl: string): Promise<CompanyScore | null> {
  const withoutTrailingSlash = docsUrl.replace(/\/$/, "");
  const candidates = Array.from(
    new Set([docsUrl, withoutTrailingSlash, `${withoutTrailingSlash}/`]),
  );
  const { data, error } = await getSupabaseAdmin()
    .from("scores")
    .select("*")
    .in("docs_url", candidates)
    .order("scored_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Supabase docs URL lookup failed: ${error.message}`);
  }

  const row = data?.[0] as ScoreRow | undefined;
  return row ? rowToCompanyScore(row) : null;
}

export async function createScoreJob(
  jobId: string,
  slug: string,
  docsUrl: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString();
  const { error } = await getSupabaseAdmin().from("score_jobs").insert({
    job_id: jobId,
    slug,
    docs_url: docsUrl,
    status: "running",
    state: { status: "running" } satisfies ScoreJobState,
    expires_at: expiresAt,
  });

  if (!error) return;
  if (!isMissingRelation(error)) {
    throw new Error(`Supabase score job creation failed: ${error.message}`);
  }

  await writeInternalJson(`score-jobs/${jobId}.json`, {
    docsUrl,
    state: { status: "running" } satisfies ScoreJobState,
    expiresAt,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateScoreJob(
  jobId: string,
  state: ScoreJobState,
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("score_jobs")
    .update({ status: state.status, state })
    .eq("job_id", jobId);

  if (!error) return;
  if (!isMissingRelation(error)) {
    throw new Error(`Supabase score job update failed: ${error.message}`);
  }

  const stored = await readInternalJson<{ docsUrl?: string; expiresAt: string }>(
    `score-jobs/${jobId}.json`,
  );
  await writeInternalJson(`score-jobs/${jobId}.json`, {
    docsUrl: stored?.docsUrl,
    state,
    expiresAt:
      stored?.expiresAt ??
      new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function getScoreJob(jobId: string): Promise<ScoreJobState | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("score_jobs")
    .select("state, expires_at, updated_at")
    .eq("job_id", jobId)
    .maybeSingle();

  if (error && !isMissingRelation(error)) {
    throw new Error(`Supabase score job lookup failed: ${error.message}`);
  }

  if (data && new Date(data.expires_at).getTime() >= Date.now()) {
    const state = data.state as ScoreJobState;
    if (
      state.status === "running" &&
      Date.now() - new Date(data.updated_at).getTime() > STALE_JOB_MS
    ) {
      return {
        status: "error",
        message: "The scan stopped before it could finish. Please start a new scan.",
      };
    }
    return state;
  }

  const stored = await readInternalJson<{
    state: ScoreJobState;
    expiresAt: string;
    updatedAt?: string;
  }>(`score-jobs/${jobId}.json`);
  if (!stored) return null;
  if (new Date(stored.expiresAt).getTime() < Date.now()) {
    await removeInternalFile(`score-jobs/${jobId}.json`);
    return null;
  }
  if (
    stored.state.status === "running" &&
    stored.updatedAt &&
    Date.now() - new Date(stored.updatedAt).getTime() > STALE_JOB_MS
  ) {
    return {
      status: "error",
      message: "The scan stopped before it could finish. Please start a new scan.",
    };
  }
  return stored.state;
}

export async function getActiveScoreJobByDocsUrl(
  docsUrl: string,
): Promise<string | null> {
  const cutoff = new Date(Date.now() - STALE_JOB_MS).toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("score_jobs")
    .select("job_id")
    .eq("docs_url", docsUrl)
    .eq("status", "running")
    .gte("updated_at", cutoff)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) return null;
    throw new Error(`Supabase active score job lookup failed: ${error.message}`);
  }

  return data?.job_id ?? null;
}

export async function consumeRequestLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const { data, error } = await getSupabaseAdmin().rpc("consume_request_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    throw new Error(`Supabase rate limit failed: ${error.message}`);
  }

  const result = data?.[0] as
    | { allowed: boolean; remaining: number; reset_at: string }
    | undefined;
  if (!result) {
    throw new Error("Supabase rate limit returned no decision.");
  }

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetAt: result.reset_at,
  };
}

export async function createContactRequest(
  request: ContactRequestInput,
): Promise<string> {
  const id = crypto.randomUUID();
  const { error } = await getSupabaseAdmin().from("contact_requests").insert({
    id,
    work_email: request.email,
    docs_url: request.docsUrl,
    source: request.source,
  });

  if (error && !isMissingRelation(error)) {
    throw new Error(`Supabase contact request insert failed: ${error.message}`);
  }

  if (isMissingRelation(error)) {
    await writeInternalJson(`contact-requests/${id}.json`, {
      id,
      workEmail: request.email,
      docsUrl: request.docsUrl,
      source: request.source,
      status: "new",
      createdAt: new Date().toISOString(),
    });
  }

  return id;
}

export async function listContactRequests(
  limit = 100,
): Promise<ContactRequestRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("contact_requests")
    .select("id, work_email, docs_url, source, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (error) {
    if (isMissingRelation(error)) return [];
    throw new Error(`Supabase contact request lookup failed: ${error.message}`);
  }

  return (data ?? []) as ContactRequestRow[];
}

export async function cleanupExpiredData(
  now: Date,
): Promise<DataCleanupResult> {
  const privateScoreCutoff = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1_000,
  ).toISOString();
  const contactCutoff = new Date(
    now.getTime() - 180 * 24 * 60 * 60 * 1_000,
  ).toISOString();
  const requestLimitCutoff = new Date(
    now.getTime() - 2 * 24 * 60 * 60 * 1_000,
  ).toISOString();

  const [
    scoreJobsResult,
    privateScoresResult,
    contactRequestsResult,
    requestLimitsResult,
  ] = await Promise.all([
    getSupabaseAdmin()
      .from("score_jobs")
      .delete()
      .lt("expires_at", now.toISOString())
      .select("job_id"),
    getSupabaseAdmin()
      .from("scores")
      .delete()
      .eq("hidden", true)
      .lt("updated_at", privateScoreCutoff)
      .select("id"),
    getSupabaseAdmin()
      .from("contact_requests")
      .delete()
      .lt("created_at", contactCutoff)
      .select("id"),
    getSupabaseAdmin()
      .from("request_limits")
      .delete()
      .lt("updated_at", requestLimitCutoff)
      .select("key"),
  ]);

  const relations = [
    ["score jobs", scoreJobsResult],
    ["private scores", privateScoresResult],
    ["contact requests", contactRequestsResult],
    ["request limits", requestLimitsResult],
  ] as const;

  for (const [label, result] of relations) {
    if (result.error && !isMissingRelation(result.error)) {
      throw new Error(
        `Supabase ${label} cleanup failed: ${result.error.message}`,
      );
    }
  }

  return {
    scoreJobs: scoreJobsResult.data?.length ?? 0,
    privateScores: privateScoresResult.data?.length ?? 0,
    contactRequests: contactRequestsResult.data?.length ?? 0,
    requestLimits: requestLimitsResult.data?.length ?? 0,
  };
}

export async function deleteScoreJob(jobId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("score_jobs")
    .delete()
    .eq("job_id", jobId);
  if (!error) return;
  if (!isMissingRelation(error)) {
    throw new Error(`Supabase score job cleanup failed: ${error.message}`);
  }
  await removeInternalFile(`score-jobs/${jobId}.json`);
}

export async function deleteContactRequest(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("contact_requests")
    .delete()
    .eq("id", id);
  if (error && !isMissingRelation(error)) {
    throw new Error(`Supabase contact request cleanup failed: ${error.message}`);
  }

  if (isMissingRelation(error)) {
    await removeInternalFile(`contact-requests/${id}.json`);
  }
}
