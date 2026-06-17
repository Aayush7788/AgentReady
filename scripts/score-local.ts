import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isBlockedDomain } from "../lib/blocked-domains";
import { inferCategory } from "../lib/categorize";
import { detectDocsProvider, detectDocsUrl } from "../lib/docs-detection";
import { AFDOCS_VERSION, runAgentReadinessScan } from "../lib/scoring";
import { displayNameFromUrl, nameToSlug, normalizeDocsUrl, urlToSlug } from "../lib/slug";
import type { CompanyScore } from "../lib/types";

function printUsage(): never {
  console.error("Usage: npm run score:local -- <url> [name] [slug] [category] [--skip-detection]");
  process.exit(1);
}

function timestampForFile(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const flags = new Set(rawArgs.filter((arg) => arg.startsWith("--")));
  const args = rawArgs.filter((arg) => !arg.startsWith("--"));

  const url = args[0] ? normalizeDocsUrl(args[0]) : null;
  if (!url) printUsage();

  if (isBlockedDomain(url)) {
    throw new Error("This domain is not eligible for scoring.");
  }

  if (!flags.has("--skip-detection")) {
    const detection = await detectDocsUrl(url);
    if (!detection.isLikely) {
      console.error(detection.warning);
      if (detection.suggestion) console.error(`Suggestion: ${detection.suggestion}`);
      process.exit(1);
    }
  }

  const name = args[1] ?? displayNameFromUrl(url);
  const slug = args[2] ?? (nameToSlug(name) || urlToSlug(url));
  const category = args[3] ?? inferCategory(url, name);
  const provider = detectDocsProvider(url);

  console.log(`Scoring ${name}`);
  console.log(`URL: ${url}`);
  console.log(`Slug: ${slug}`);
  console.log(`Category: ${category}`);

  const { report, breakdown } = await runAgentReadinessScan(url, {
    requestTimeout: 15_000,
    requestDelay: 200,
    maxConcurrency: 3,
    maxLinksToTest: 10,
  });

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
    hidden: true,
    docsProvider: provider,
    platformDetected: provider,
  };

  const outputDir = join(process.cwd(), "reports", "local");
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, `${score.slug}-${timestampForFile()}.json`);
  writeFileSync(outputPath, `${JSON.stringify(score, null, 2)}\n`, "utf-8");

  console.log(`Score: ${score.score} (${score.grade})`);
  console.log(`Checks: ${score.checks.pass}/${score.checks.total} pass`);
  console.log(`Saved local report: ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

