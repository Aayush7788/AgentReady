import { afterEach, describe, expect, it, vi } from "vitest";
import { detectDocsProvider, detectDocsUrl } from "@/lib/docs-detection";

type FakeResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

function response(ok: boolean, status: number, body = ""): FakeResponse {
  return { ok, status, text: async () => body };
}

function stubFetch(routes: { llms?: FakeResponse | "throw"; page?: FakeResponse | "throw" }) {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const url = String(input);
    const route = url.endsWith("/llms.txt") ? routes.llms : routes.page;
    if (route === "throw") throw new Error("network error");
    if (!route) throw new Error(`unexpected fetch ${url}`);
    return route as unknown as Response;
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("detectDocsProvider", () => {
  it("detects common hosted documentation platforms", () => {
    expect(detectDocsProvider("https://acme.readme.io")).toBe("ReadMe");
    expect(detectDocsProvider("https://acme.gitbook.io/docs")).toBe("GitBook");
  });
});

describe("detectDocsUrl", () => {
  it("accepts structural docs hosts without network calls", async () => {
    const fetchMock = stubFetch({});
    expect(await detectDocsUrl("https://docs.razorpay.com")).toMatchObject({ isLikely: true });
    expect(await detectDocsUrl("https://developer.phonepe.com/payment-gateway")).toMatchObject({
      isLikely: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a docs-like path", async () => {
    stubFetch({});
    expect(await detectDocsUrl("https://example.com/api/reference")).toMatchObject({ isLikely: true });
    expect(await detectDocsUrl("https://example.com/tech-resources")).toMatchObject({ isLikely: true });
  });

  it("does not treat llms.txt alone as enough for a root marketing page", async () => {
    stubFetch({
      llms: response(true, 200),
      page: response(true, 200, "<title>Acme sales platform</title><h1>Buy now</h1>"),
    });

    const result = await detectDocsUrl("https://example.com/");
    expect(result.isLikely).toBe(false);
    expect(result.warning).toMatch(/marketing or product/i);
  });

  it("trusts llms.txt for a non-root URL", async () => {
    const fetchMock = stubFetch({ llms: response(true, 200) });
    await expect(detectDocsUrl("https://example.com/platform")).resolves.toMatchObject({ isLikely: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("accepts page content that looks like API docs", async () => {
    stubFetch({
      llms: response(false, 404),
      page: response(true, 200, "<title>Acme API Reference</title><pre>x</pre>"),
    });

    await expect(detectDocsUrl("https://example.com/")).resolves.toMatchObject({ isLikely: true });
  });

  it("returns a clear warning when the page is unreachable", async () => {
    stubFetch({ llms: response(false, 404), page: response(false, 503) });
    const result = await detectDocsUrl("https://example.com/");
    expect(result.isLikely).toBe(false);
    expect(result.warning).toMatch(/HTTP 503/);
  });
});
