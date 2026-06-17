import { describe, expect, it } from "vitest";
import { displayNameFromUrl, nameToSlug, normalizeDocsUrl, urlToSlug } from "@/lib/slug";

describe("slug helpers", () => {
  it("normalizes docs URLs without requiring the user to type a protocol", () => {
    expect(normalizeDocsUrl("docs.razorpay.com")).toBe("https://docs.razorpay.com/");
  });

  it("rejects unsafe or malformed URL input", () => {
    expect(normalizeDocsUrl("not a url")).toBeNull();
    expect(normalizeDocsUrl("https://example.com/<script>")).toBeNull();
    expect(normalizeDocsUrl("ftp://example.com/docs")).toBeNull();
  });

  it("creates stable slugs from names and URLs", () => {
    expect(nameToSlug("Cashfree Payments")).toBe("cashfree-payments");
    expect(nameToSlug("Banking & Fintech")).toBe("banking-and-fintech");
    expect(urlToSlug("https://developer.phonepe.com/payment-gateway")).toBe(
      "developer-phonepe-com-payment-gateway",
    );
  });

  it("derives a readable name from common docs hosts", () => {
    expect(displayNameFromUrl("https://docs.sarvam.ai")).toBe("Sarvam");
    expect(displayNameFromUrl("https://developer.exotel.com")).toBe("Exotel");
  });
});

