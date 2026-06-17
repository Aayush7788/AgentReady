import { describe, expect, it } from "vitest";
import { isBlockedDomain } from "@/lib/blocked-domains";

describe("blocked domain filter", () => {
  it("blocks explicit adult domains and subdomains", () => {
    expect(isBlockedDomain("https://example.xxx")).toBe(true);
    expect(isBlockedDomain("https://sub.xvideos.com/docs")).toBe(true);
  });

  it("does not block normal docs URLs", () => {
    expect(isBlockedDomain("https://razorpay.com/docs")).toBe(false);
    expect(isBlockedDomain("developer.phonepe.com/payment-gateway")).toBe(false);
  });
});

