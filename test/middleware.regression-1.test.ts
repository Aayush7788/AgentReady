import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

// Regression: ISSUE-002 - missing reports rendered a 404 UI with HTTP 200
// Found by /qa on 2026-06-18
// Report: .gstack/qa-reports/qa-report-localhost-2026-06-18.md
describe("public report route validation", () => {
  it("returns HTTP 404 for an unknown company page", () => {
    const response = middleware(
      new NextRequest("http://localhost/companies/not-a-real-company"),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("x-middleware-rewrite")).toContain(
      "/report-not-found",
    );
  });

  it("returns Markdown with HTTP 404 for an unknown company Markdown URL", async () => {
    const response = middleware(
      new NextRequest("http://localhost/companies/not-a-real-company.md"),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("text/markdown");
    await expect(response.text()).resolves.toContain("Report not found");
  });

  it("returns HTTP 404 for a malformed private scan URL", () => {
    const response = middleware(
      new NextRequest("http://localhost/scans/not-a-job"),
    );

    expect(response.status).toBe(404);
  });
});
