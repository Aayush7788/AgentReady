import { computeScoreBreakdown, type ReportResult } from "../lib/scoring";
import { getAllScores, upsertScore } from "../lib/supabase";
import type { CompanyScore } from "../lib/types";

function toStoredReport(score: CompanyScore): ReportResult {
  return {
    url: score.docsUrl,
    timestamp: score.scoredAt,
    specUrl: `${score.docsUrl.replace(/\/$/, "")}/llms.txt`,
    results: score.results ?? [],
    summary: score.checks,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const scores = await getAllScores({ includeHidden: true });
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;

  console.log(`Loaded ${scores.length} score rows.`);
  if (dryRun) console.log("Dry run enabled. No rows will be updated.");

  for (const score of scores) {
    if (!score.results?.length) {
      skipped += 1;
      console.log(`[skip]      ${score.slug} - no stored check results`);
      continue;
    }

    const breakdown = computeScoreBreakdown(toStoredReport(score));
    const changed =
      score.score !== breakdown.score ||
      score.grade !== breakdown.grade ||
      JSON.stringify(score.categoryScores ?? {}) !== JSON.stringify(breakdown.categoryScores);

    if (!changed) {
      unchanged += 1;
      console.log(`[unchanged] ${score.slug} - ${score.score} (${score.grade})`);
      continue;
    }

    updated += 1;
    console.log(
      `[update]    ${score.slug} - ${score.score} (${score.grade}) -> ${breakdown.score} (${breakdown.grade})`,
    );

    if (!dryRun) {
      await upsertScore({
        ...score,
        score: breakdown.score,
        grade: breakdown.grade,
        checks: breakdown.checks,
        categoryScores: breakdown.categoryScores,
      });
    }
  }

  console.log(`Done. ${updated} updated, ${unchanged} unchanged, ${skipped} skipped.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

