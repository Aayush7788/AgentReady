import { describe, expect, it } from "vitest";
import companies from "@/data/companies.json";
import { CATEGORIES } from "@/lib/categorize";
import { normalizeDocsUrl, nameToSlug } from "@/lib/slug";

describe("companies seed data", () => {
  it("uses valid public docs URL shapes and known categories", () => {
    const categories = new Set<string>(CATEGORIES);

    for (const company of companies) {
      expect(company.name).toBeTruthy();
      expect(company.slug).toBe(nameToSlug(company.slug));
      expect(categories.has(company.category)).toBe(true);
      expect(normalizeDocsUrl(company.docsUrl)).toBeTruthy();
    }
  });

  it("does not duplicate slugs or docs URLs", () => {
    const slugs = new Set<string>();
    const docsUrls = new Set<string>();

    for (const company of companies) {
      expect(slugs.has(company.slug)).toBe(false);
      expect(docsUrls.has(company.docsUrl)).toBe(false);
      slugs.add(company.slug);
      docsUrls.add(company.docsUrl);
    }
  });
});
