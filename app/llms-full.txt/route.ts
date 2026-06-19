import { getSiteUrl } from "@/lib/env";
import { getPublicLeaderboard } from "@/lib/public-scores";
import { readinessCategories, readinessPrinciples } from "@/frontend/lib/content";

export const runtime = "nodejs";

export async function GET() {
  const siteUrl = getSiteUrl();
  const companies = await getPublicLeaderboard();

  const body = [
    "# AgentReady full agent-readable index",
    "",
    "Agent-readable site index: /llms.txt",
    "",
    "## Purpose",
    "",
    "AgentReady evaluates whether agents can discover what a business does, understand available actions, safely use its documentation, and return useful output.",
    "",
    "## Scoring procedure",
    "",
    ...readinessCategories.map(
      (category) =>
        `- ${category.title} (${category.checks} checks): ${category.description}`,
    ),
    "",
    "## Why readiness matters",
    "",
    ...readinessPrinciples.map(
      (principle) => `- ${principle.title}: ${principle.description}`,
    ),
    "",
    "## Public leaderboard",
    "",
    ...companies.map(
      (company) =>
        `- ${company.name}: ${company.score}/100, grade ${company.grade}, ${company.checks.pass}/${company.checks.total} checks passed. Report: ${siteUrl}/companies/${company.slug}.md`,
    ),
    "",
    "## Interfaces",
    "",
    `- Homepage markdown: ${siteUrl}/index.md`,
    `- Leaderboard JSON: ${siteUrl}/api/leaderboard`,
    `- Start a scan: POST ${siteUrl}/api/score with JSON {"url":"https://docs.example.com"}`,
    "",
    "## Contact",
    "",
    "- Company: AgentReady",
    "- Founder and developer: Aayush Kotadia",
    "- Email: aayushkotadia76@gmail.com",
    "- Website: https://aayushkotadia.vercel.app/",
    "- LinkedIn: https://www.linkedin.com/in/aayush-kotadia/",
    "",
    "Special thanks to Dachary Carey, creator and developer of AFDocs.",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
