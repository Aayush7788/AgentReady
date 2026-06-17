import { setScoreVisibility } from "../lib/supabase";

function printUsage(): never {
  console.error("Usage: npm run score:visibility -- <slug> <publish|hide>");
  process.exit(1);
}

async function main() {
  const [slug, action] = process.argv.slice(2);
  if (!slug || !action) printUsage();

  const normalizedAction = action.toLowerCase();
  if (!["publish", "hide"].includes(normalizedAction)) printUsage();

  const hidden = normalizedAction === "hide";
  const updated = await setScoreVisibility(slug, hidden);

  if (!updated) {
    console.error(`No score row found for slug: ${slug}`);
    process.exit(1);
  }

  console.log(`${updated.slug} is now ${updated.hidden ? "hidden" : "public"}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

