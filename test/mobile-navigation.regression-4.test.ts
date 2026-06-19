import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Regression: section navigation disappeared below 900px on a long homepage.
describe("mobile navigation", () => {
  it("provides a compact menu that closes after choosing a destination", () => {
    const source = readFileSync(
      "frontend/components/site-header.tsx",
      "utf8",
    );

    expect(source).toContain('aria-label="Mobile navigation"');
    expect(source).toContain('"Open navigation"');
    expect(source).toContain('href: "/#leaderboard"');
    expect(source).toContain('href: "/#contact"');
    expect(source).toContain("onClick={() => setMenuOpen(false)}");
  });
});
