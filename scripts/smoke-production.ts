import {
  createScoreJob,
  deleteContactRequest,
  deleteScoreJob,
  getScoreJob,
  getScoreBySlug,
  updateScoreJob,
} from "../lib/supabase";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

async function expectResponse(
  path: string,
  options: RequestInit = {},
  expectedStatus = 200,
) {
  const response = await fetch(`${baseUrl}${path}`, options);
  if (response.status !== expectedStatus) {
    throw new Error(
      `${options.method ?? "GET"} ${path} returned ${response.status}, expected ${expectedStatus}.`,
    );
  }
  return response;
}

async function main() {
  await expectResponse("/");
  await expectResponse("/companies/sarvam-ai");
  await expectResponse("/companies/not-a-real-company", {}, 404);
  await expectResponse("/api/leaderboard");
  await expectResponse("/api/company/sarvam-ai");
  await expectResponse("/llms.txt");
  await expectResponse("/llms-full.txt");
  await expectResponse("/index.md");
  await expectResponse("/companies/not-a-real-company.md", {}, 404);
  await expectResponse("/scans/not-a-job", {}, 404);

  const companyMarkdown = await expectResponse("/companies/sarvam-ai.md");
  if (
    !(await companyMarkdown.text()).startsWith(
      "# Sarvam AI documentation readiness",
    )
  ) {
    throw new Error("Company Markdown route returned the wrong document.");
  }

  const leaderboardResponse = await expectResponse("/api/leaderboard");
  const leaderboard = (await leaderboardResponse.json()) as Array<{
    results?: unknown;
    categoryScores?: unknown;
  }>;
  if (
    leaderboard.length !== 25 ||
    leaderboard.some(
      (company) =>
        company.results !== undefined ||
        company.categoryScores !== undefined,
    )
  ) {
    throw new Error("Leaderboard response is not the expected 25-row summary.");
  }

  const negotiated = await expectResponse("/", {
    headers: { Accept: "text/markdown" },
  });
  if (!negotiated.headers.get("content-type")?.includes("text/markdown")) {
    throw new Error("Homepage content negotiation did not return markdown.");
  }

  await expectResponse("/api/score/not-a-job", {}, 400);

  const existingScore = await expectResponse("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://docs.sarvam.ai" }),
  });
  const existingBody = (await existingScore.json()) as {
    existing?: boolean;
    slug?: string;
  };
  if (!existingBody.existing || existingBody.slug !== "sarvam-ai") {
    throw new Error("Known documentation URL did not resolve to its existing report.");
  }

  const jobId = crypto.randomUUID();
  await createScoreJob(jobId, "smoke-test", "https://docs.sarvam.ai/");

  try {
    const jobResponse = await expectResponse(`/api/score/${jobId}`);
    if (!jobResponse.headers.get("cache-control")?.includes("no-store")) {
      throw new Error("Score job polling response is cacheable.");
    }
    const jobBody = (await jobResponse.json()) as { status?: string };
    if (jobBody.status !== "running") {
      throw new Error("Stored score job was not returned as running.");
    }
    if ((await getScoreJob(jobId))?.status !== "running") {
      throw new Error("Stored score job could not be read through the persistence layer.");
    }

    const company = await getScoreBySlug("sarvam-ai", { includeHidden: true });
    if (!company) throw new Error("Smoke report company was not found.");
    await updateScoreJob(jobId, {
      status: "complete",
      slug: company.slug,
      score: company.score,
      grade: company.grade,
      summary: company.checks,
      results: company.results,
      company,
    });
    const completedResponse = await expectResponse(`/api/score/${jobId}`);
    const completedBody = (await completedResponse.json()) as {
      status?: string;
      company?: { slug?: string };
    };
    if (
      completedBody.status !== "complete" ||
      completedBody.company?.slug !== "sarvam-ai"
    ) {
      throw new Error("Completed private score job did not return its report.");
    }
  } finally {
    await deleteScoreJob(jobId);
  }

  const email = `agentready-smoke-${Date.now()}@example.com`;
  const contactResponse = await expectResponse(
    "/api/contact",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        docsUrl: "https://docs.example.com",
      }),
    },
    201,
  );
  const contactBody = (await contactResponse.json()) as {
    message?: string;
    requestId?: string;
  };
  if (!contactBody.message || !contactBody.requestId) {
    throw new Error("Contact response did not include its request details.");
  }
  await deleteContactRequest(contactBody.requestId);

  console.log("Production smoke checks passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
