import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "../lib/env";
import { getAllScores } from "../lib/supabase";

async function main() {
  const { url, serviceRoleKey } = getSupabaseEnv();
  const admin = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const scores = await getAllScores({ includeHidden: true });
  const tables = [
    "score_jobs",
    "contact_requests",
    "request_limits",
  ] as const;

  for (const table of tables) {
    const { error } = await admin.from(table).select("*", {
      count: "exact",
      head: true,
    });
    if (error) {
      throw new Error(
        `Supabase table "${table}" is unavailable: ${error.message}. Apply the production migration.`,
      );
    }
  }

  const testKey = `setup-check:${crypto.randomUUID()}`;
  const { error: rateLimitError } = await admin.rpc("consume_request_limit", {
    p_key: testKey,
    p_limit: 1,
    p_window_seconds: 60,
  });
  if (rateLimitError) {
    throw new Error(
      `Supabase rate-limit function is unavailable: ${rateLimitError.message}. Apply the production migration.`,
    );
  }
  await admin.from("request_limits").delete().eq("key", testKey);

  console.log(
    `Supabase production storage OK. Found ${scores.length} score rows.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
