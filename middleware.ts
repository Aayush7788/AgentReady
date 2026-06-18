import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import companies from "@/data/companies.json";

const PUBLIC_COMPANY_SLUGS = new Set(companies.map((company) => company.slug));
const JOB_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function markdownNotFound() {
  return new NextResponse("# Report not found\n", {
    status: 404,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "no-store",
      Vary: "Accept",
    },
  });
}

function htmlNotFound(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/report-not-found";
  url.search = "";
  return NextResponse.rewrite(url, { status: 404 });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const wantsMarkdown = request.headers
    .get("accept")
    ?.toLowerCase()
    .includes("text/markdown");
  const hasMarkdownSuffix = pathname.endsWith(".md");
  const companyMatch = pathname.match(
    /^\/companies\/([a-z0-9-]+)(?:\.md)?$/,
  );

  if (companyMatch && !PUBLIC_COMPANY_SLUGS.has(companyMatch[1])) {
    return wantsMarkdown || hasMarkdownSuffix
      ? markdownNotFound()
      : htmlNotFound(request);
  }

  const scanMatch = pathname.match(/^\/scans\/([^/]+)$/);
  if (scanMatch && !JOB_ID_PATTERN.test(scanMatch[1])) {
    return htmlNotFound(request);
  }

  if (!wantsMarkdown && !hasMarkdownSuffix) return NextResponse.next();

  const markdownPath = hasMarkdownSuffix ? pathname.slice(0, -3) || "/" : pathname;
  const url = request.nextUrl.clone();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-agentready-markdown-path", markdownPath);
  url.pathname = "/api/markdown";
  url.search = "";
  url.searchParams.set("path", markdownPath);
  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|llms.txt|llms-full.txt|robots.txt|sitemap.xml).*)"],
};
