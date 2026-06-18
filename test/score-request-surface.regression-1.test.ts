import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Regression: public callers could provide force, slug, name, and category
// values that changed stored scores and could overwrite curated leaderboard rows.
describe("public score request surface", () => {
  it("accepts only the documentation URL from request JSON", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "api", "score", "route.ts"),
      "utf-8",
    );
    const requestBody = source.match(
      /interface ScoreRequestBody \{([\s\S]*?)\n\}/,
    )?.[1];

    expect(requestBody).toContain("url?: unknown");
    expect(requestBody).not.toMatch(/\b(force|slug|name|category|skipDetection)\b/);
  });
});
