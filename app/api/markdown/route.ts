import { NextResponse } from "next/server";
import { categoryLabels, readinessCategories } from "@/frontend/lib/content";
import { getCompanyScore, getLeaderboard } from "@/lib/scores";

export const runtime = "nodejs";

function markdownResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": status === 200 ? "public, max-age=300" : "no-store",
      Vary: "Accept",
    },
  });
}

async function homepageMarkdown(): Promise<string> {
  const companies = await getLeaderboard();
  return [
    "# AgentReady",
    "",
    "Agent-readable site index: /llms.txt",
    "",
    "AgentReady measures whether public business documentation is discoverable, understandable, and usable by AI agents.",
    "",
    "## Score documentation",
    "",
    "Submit a public documentation URL through the homepage or POST JSON to `/api/score` with a `url` field.",
    "",
    "## Method",
    "",
    "The scoring engine runs 23 checks across seven categories:",
    ...readinessCategories.map(
      (category) =>
        `- **${category.title}** (${category.checks} checks): ${category.description}`,
    ),
    "",
    "## Public leaderboard",
    "",
    ...companies.map(
      (company) =>
        `- [${company.name}](/companies/${company.slug}.md): ${company.score}/100, grade ${company.grade}, ${company.checks.pass}/${company.checks.total} checks passed.`,
    ),
    "",
    "## Contact",
    "",
    "For documentation-readiness work, email aayushkotadia76@gmail.com.",
  ].join("\n");
}

async function companyMarkdown(slug: string): Promise<string | null> {
  const company = await getCompanyScore(slug);
  if (!company) return null;

  return [
    `# ${company.name} documentation readiness`,
    "",
    "Agent-readable site index: /llms.txt",
    "",
    `- Score: ${company.score}/100`,
    `- Grade: ${company.grade}`,
    `- Category: ${company.category}`,
    `- Documentation: ${company.docsUrl}`,
    `- Scored at: ${company.scoredAt}`,
    `- Checks: ${company.checks.pass} pass, ${company.checks.warn} warn, ${company.checks.fail} fail, ${company.checks.skip} skip, ${company.checks.error} error`,
    "",
    "## Category scores",
    "",
    ...readinessCategories.map((category) => {
      const score = company.categoryScores?.[category.id];
      return `- ${category.title}: ${
        typeof score === "number" ? `${Math.round(score)}/100` : "N/A"
      }`;
    }),
    "",
    "## Check results",
    "",
    ...(company.results ?? []).map(
      (result) =>
        `- **${result.status.toUpperCase()} ${result.id}** (${categoryLabels[result.category] ?? result.category}): ${result.message}`,
    ),
  ].join("\n");
}

export async function GET(request: Request) {
  const path =
    request.headers.get("x-agentready-markdown-path") ??
    new URL(request.url).searchParams.get("path") ??
    "/";

  try {
    if (path === "/" || path === "/index") {
      return markdownResponse(await homepageMarkdown());
    }

    const companyMatch = path.match(/^\/companies\/([a-z0-9-]+)$/);
    if (companyMatch) {
      const report = await companyMarkdown(companyMatch[1]);
      return report
        ? markdownResponse(report)
        : markdownResponse("# Report not found\n", 404);
    }

    return markdownResponse("# Page not found\n", 404);
  } catch (error) {
    console.error(
      "[markdown] rendering failed",
      error instanceof Error ? error.message : error,
    );
    return markdownResponse("# AgentReady content is temporarily unavailable\n", 503);
  }
}
