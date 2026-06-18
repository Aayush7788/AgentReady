import { listContactRequests } from "../lib/supabase";

async function main() {
  const requestedLimit = Number.parseInt(process.argv[2] ?? "100", 10);
  const rows = await listContactRequests(
    Number.isFinite(requestedLimit) ? requestedLimit : 100,
  );

  if (rows.length === 0) {
    console.log("No contact requests found.");
    return;
  }

  console.table(
    rows.map((row) => ({
      createdAt: row.created_at,
      status: row.status,
      email: row.work_email,
      docsUrl: row.docs_url,
      id: row.id,
    })),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
