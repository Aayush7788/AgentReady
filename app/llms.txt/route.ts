import { getSiteUrl } from "@/lib/env";
import { getLeaderboard } from "@/lib/scores";

export const runtime = "nodejs";

export async function GET() {
  const siteUrl = getSiteUrl();
  const companies = await getLeaderboard().catch(() => []);

  const body = [
    "# AgentReady",
    "",
    "> AgentReady measures whether public business documentation is discoverable, understandable, and usable by AI agents.",
    "",
    "## Product",
    "",
    `- [Homepage](${siteUrl}/index.md): Score a public documentation site and browse the Indian company leaderboard.`,
    `- [Full agent-readable index](${siteUrl}/llms-full.txt): Complete product and leaderboard context.`,
    `- [Leaderboard API](${siteUrl}/api/leaderboard): Structured public leaderboard data.`,
    "",
    "## Company reports",
    "",
    ...companies.map(
      (company) =>
        `- [${company.name}](${siteUrl}/companies/${company.slug}.md): ${company.score}/100, grade ${company.grade}.`,
    ),
    "",
    "## Notes for agents",
    "",
    "- AgentReady uses AFDocs as its base scoring engine.",
    "- The methodology currently contains 23 checks across seven categories.",
    "- The scoring engine checks public documentation URLs.",
    "- User-submitted scans may be hidden from the public leaderboard until reviewed.",
    "- Public leaderboard entries are read-only through this site.",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
