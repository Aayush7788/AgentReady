import { runDataMaintenance } from "../lib/maintenance";

async function main() {
  const removed = await runDataMaintenance();
  console.log("Expired data cleanup complete.");
  console.table(removed);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
