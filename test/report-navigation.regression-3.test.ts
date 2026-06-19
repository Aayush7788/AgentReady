import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Regression: cross-page client navigation updated the hash but left users at
// the homepage top instead of returning them to the leaderboard.
describe("company report navigation", () => {
  it("restores the requested homepage section after hydration", () => {
    const homeSource = readFileSync(
      "frontend/components/home-page.tsx",
      "utf8",
    );
    const restorerSource = readFileSync(
      "frontend/components/hash-scroll-restorer.tsx",
      "utf8",
    );

    expect(homeSource).toContain("<HashScrollRestorer />");
    expect(restorerSource).toContain("window.location.hash.slice(1)");
    expect(restorerSource).toContain('scrollBehavior = "auto"');
    expect(restorerSource).toContain("scrollIntoView");
  });
});
