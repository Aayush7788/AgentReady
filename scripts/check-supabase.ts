import { getAllScores } from "../lib/supabase";

async function main() {
  const scores = await getAllScores({ includeHidden: true });
  console.log(`Supabase connection OK. Found ${scores.length} score rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

