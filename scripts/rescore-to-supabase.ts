import { readFileSync } from "node:fs";
import { join } from "node:path";
import { detectDocsProvider } from "../lib/docs-detection";
import { AFDOCS_VERSION, runAgentReadinessScan } from "../lib/scoring";
import { upsertScore } from "../lib/supabase";
import type { CompanyScore } from "../lib/types";

interface SeedCompany {
  name: string;
  slug: string;
  category: string;
  docsUrl: string;
}

function readCompanies(): SeedCompany[] {
  const raw = readFileSync(join(process.cwd(), "data", "companies.json"), "utf-8");
  return JSON.parse(raw) as SeedCompany[];
}

async function main() {
  const companies = readCompanies();
  let passed = 0;
  let failed = 0;

  console.log(`Scoring ${companies.length} seeded companies`);

  for (const company of companies) {
    try {
      process.stdout.write(`${company.name} ... `);
      const { report, breakdown } = await runAgentReadinessScan(company.docsUrl);
      const provider = detectDocsProvider(company.docsUrl);

      const score: CompanyScore = {
        name: company.name,
        slug: company.slug,
        category: company.category,
        docsUrl: company.docsUrl,
        score: breakdown.score,
        grade: breakdown.grade,
        scoredAt: new Date().toISOString(),
        checks: breakdown.checks,
        results: report.results,
        categoryScores: breakdown.categoryScores,
        afdocsVersion: AFDOCS_VERSION,
        hidden: false,
        docsProvider: provider,
        platformDetected: provider,
      };

      await upsertScore(score);
      passed += 1;
      process.stdout.write(`${score.score} (${score.grade})\n`);
    } catch (error) {
      failed += 1;
      process.stdout.write("failed\n");
      console.error(error instanceof Error ? error.message : error);
    }
  }

  console.log(`Done. ${passed} saved, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

