import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";
import type { CompanyScore } from "./types";

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
  category_scores: Record<string, number> | null;
  afdocs_version: string | null;
  hidden: boolean | null;
  docs_provider: string | null;
  platform_detected: string | null;
}

type ScoreInsert = Omit<
  ScoreRow,
  "id" | "hidden" | "results" | "category_scores" | "afdocs_version" | "docs_provider" | "platform_detected"
> & {
  id?: string;
  hidden?: boolean | null;
  results?: CompanyScore["results"] | null;
  category_scores?: Record<string, number> | null;
  afdocs_version?: string | null;
  docs_provider?: string | null;
  platform_detected?: string | null;
};

// Supabase's generated types should replace this untyped client once the project
// has a linked Supabase project and generated Database type.
type SupabaseAdminClient = ReturnType<typeof createClient<any>>;

let cachedClient: SupabaseAdminClient | null = null;

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
