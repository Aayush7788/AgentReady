import { getSiteUrl } from "@/lib/env";

export const runtime = "nodejs";

export function GET() {
  const siteUrl = getSiteUrl();

  const body = [
    "# AgentReady",
    "",
    "AgentReady scores how usable public documentation is for AI agents.",
    "",
    "## Useful URLs",
    `- Homepage: ${siteUrl}`,
    `- Leaderboard API: ${siteUrl}/api/leaderboard`,
    "",
    "## Notes for agents",
    "- The scoring engine checks public documentation URLs.",
    "- User-submitted scans may be hidden from the public leaderboard until reviewed.",
    "- Public leaderboard entries are read-only through this site.",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

