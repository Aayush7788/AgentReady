import companies from "../data/companies.json";
import { detectDocsUrl } from "../lib/docs-detection";
import { normalizeDocsUrl } from "../lib/slug";

async function main() {
  let keep = 0;
  let review = 0;

  for (const company of companies) {
    const url = normalizeDocsUrl(company.docsUrl);
    if (!url) {
      review += 1;
      console.log(`[review] ${company.name} - invalid URL`);
      continue;
    }

    try {
      const detection = await detectDocsUrl(url);
      if (detection.isLikely) {
        keep += 1;
        console.log(`[keep]   ${company.name} - ${url}`);
      } else {
        review += 1;
        console.log(`[review] ${company.name} - ${detection.warning ?? "not docs-like"}`);
        if (detection.suggestion) console.log(`         suggestion: ${detection.suggestion}`);
      }
    } catch (error) {
      review += 1;
      console.log(`[review] ${company.name} - ${error instanceof Error ? error.message : "audit failed"}`);
    }
  }

  console.log(`\nDone. ${keep} keep / ${review} review.`);
  if (review > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

