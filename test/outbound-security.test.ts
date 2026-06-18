import { describe, expect, it } from "vitest";
import {
  assertPublicHttpUrl,
  isPublicAddress,
  privateScanSlug,
} from "@/lib/outbound-security";

describe("outbound scan security", () => {
  it("rejects private, loopback, link-local, and metadata addresses", () => {
    expect(isPublicAddress("127.0.0.1")).toBe(false);
    expect(isPublicAddress("10.0.0.8")).toBe(false);
    expect(isPublicAddress("169.254.169.254")).toBe(false);
    expect(isPublicAddress("::1")).toBe(false);
    expect(isPublicAddress("fc00::1")).toBe(false);
    expect(isPublicAddress("8.8.8.8")).toBe(true);
    expect(isPublicAddress("2606:4700:4700::1111")).toBe(true);
  });

  it("rejects local hostnames and custom ports", async () => {
    await expect(
      assertPublicHttpUrl("http://localhost/docs"),
    ).rejects.toThrow(/private or local/i);
    await expect(
      assertPublicHttpUrl("https://docs.example.com:8443"),
    ).rejects.toThrow(/custom ports/i);
  });

  it("rejects public-looking hostnames that resolve privately", async () => {
    await expect(
      assertPublicHttpUrl(
        "https://docs.example.com",
        async () => ["192.168.1.10"],
      ),
    ).rejects.toThrow(/private or reserved/i);
  });

  it("accepts public hosts when every resolved address is public", async () => {
    await expect(
      assertPublicHttpUrl(
        "https://docs.example.com",
        async () => ["8.8.8.8", "2606:4700:4700::1111"],
      ),
    ).resolves.toMatchObject({
      hostname: "docs.example.com",
      protocol: "https:",
    });
  });

  it("generates stable, URL-specific private scan slugs", () => {
    const first = privateScanSlug("https://docs.example.com/api");
    const repeated = privateScanSlug("https://docs.example.com/api");
    const different = privateScanSlug("https://docs.example.com/guides");

    expect(first).toBe(repeated);
    expect(first).not.toBe(different);
    expect(first).toMatch(/^scan-docs-example-com-api-[a-f0-9]{12}$/);
  });
});
