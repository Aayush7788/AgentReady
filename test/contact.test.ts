import { describe, expect, it } from "vitest";
import { parseContactRequest } from "@/lib/contact";

describe("parseContactRequest", () => {
  it("normalizes valid contact requests", () => {
    expect(
      parseContactRequest({
        email: " Founder@Example.com ",
        docsUrl: "docs.example.com/",
      }),
    ).toEqual({
      success: true,
      isBot: false,
      data: {
        email: "founder@example.com",
        docsUrl: "https://docs.example.com/",
        source: "website_audit_request",
      },
    });
  });

  it("rejects invalid email and URL input", () => {
    expect(
      parseContactRequest({ email: "not-an-email", docsUrl: "invalid" }),
    ).toEqual({
      success: false,
      message: "Provide a valid work email and public documentation URL.",
    });
  });

  it("accepts the honeypot as a bot submission", () => {
    const result = parseContactRequest({
      email: "bot@example.com",
      docsUrl: "https://docs.example.com",
      website: "spam",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.isBot).toBe(true);
  });
});
