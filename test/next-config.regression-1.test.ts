import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants.js";
import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config.mjs";

// Regression: ISSUE-009 - development and production servers shared .next output
// Found by /qa on 2026-06-18
// Report: .gstack/qa-reports/qa-report-localhost-2026-06-18.md
describe("Next.js build output isolation", () => {
  it("uses separate output directories for development and production", () => {
    expect(nextConfig(PHASE_DEVELOPMENT_SERVER).distDir).toBe(".next-dev");
    expect(nextConfig(PHASE_PRODUCTION_BUILD).distDir).toBe(".next");
  });

  it("adds browser security headers to every route", async () => {
    const config = nextConfig(PHASE_PRODUCTION_BUILD);
    const rules = await config.headers();
    const headers = new Map(
      rules[0].headers.map((header) => [header.key, header.value]),
    );

    expect(headers.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
  });
});
