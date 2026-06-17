import { detectDocsProvider } from "../lib/docs-detection";
import { inferCategory } from "../lib/categorize";
import { AFDOCS_VERSION, runAgentReadinessScan } from "../lib/scoring";
import { displayNameFromUrl, nameToSlug, normalizeDocsUrl, urlToSlug } from "../lib/slug";
import { upsertScore } from "../lib/supabase";
import type { CompanyScore } from "../lib/types";

function printUsage(): never {
  console.error("Usage: npm run score:single -- <url> [name] [slug] [category] [--hidden]");
  process.exit(1);
}

function elapsed(start: number): string {
  const seconds = Math.round((Date.now() - start) / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const flags = new Set(rawArgs.filter((arg) => arg.startsWith("--")));
  const args = rawArgs.filter((arg) => !arg.startsWith("--"));

  const url = args[0] ? normalizeDocsUrl(args[0]) : null;
  if (!url) printUsage();

  const name = args[1] ?? displayNameFromUrl(url);
  const slug = args[2] ?? (nameToSlug(name) || urlToSlug(url));
  const category = args[3] ?? inferCategory(url, name);
  const hidden = flags.has("--hidden");

  console.log(`Scoring ${name}`);
  console.log(`URL: ${url}`);
  console.log(`Slug: ${slug}`);
  console.log(`Category: ${category}`);
  console.log(`Hidden: ${hidden}`);

  const started = Date.now();
  const { report, breakdown } = await runAgentReadinessScan(url, {
    requestTimeout: 15_000,
    requestDelay: 200,
    maxConcurrency: 3,
    maxLinksToTest: 10,
  });

  const provider = detectDocsProvider(url);
  const score: CompanyScore = {
    name,
    slug,
    category,
    docsUrl: url,
    score: breakdown.score,
    grade: breakdown.grade,
    scoredAt: new Date().toISOString(),
    checks: breakdown.checks,
    results: report.results,
    categoryScores: breakdown.categoryScores,
    afdocsVersion: AFDOCS_VERSION,
    hidden,
    docsProvider: provider,
    platformDetected: provider,
  };

  await upsertScore(score);

  console.log(`Score: ${score.score} (${score.grade})`);
  console.log(`Checks: ${score.checks.pass}/${score.checks.total} pass`);
  console.log(`Saved to Supabase in ${elapsed(started)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
