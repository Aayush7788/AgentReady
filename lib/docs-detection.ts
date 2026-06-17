const DOCS_HOST_PREFIX = /^(docs|developer|developers|api|reference|learn|support)\./i;
const DOCS_PATH =
  /\/(docs|documentation|developers?|api|reference|guides|sdk|learn|manual|help|support|tech-resources|technical-resources)(\/|$)/i;
const DOCS_TITLE = /docs|documentation|api\s|reference|developer|quickstart|sdk/i;

const PLATFORM_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "ReadMe", pattern: /(^|\.)readme\.io$/i },
  { name: "GitBook", pattern: /(^|\.)gitbook\.io$/i },
  { name: "Mintlify", pattern: /(^|\.)mintlify\.app$/i },
  { name: "Docusaurus", pattern: /\/docs(\/|$)/i },
  { name: "Notion", pattern: /(^|\.)notion\.site$/i },
  { name: "GitHub Pages", pattern: /(^|\.)github\.io$/i },
];

export interface DocsDetection {
  isLikely: boolean;
  warning?: string;
  suggestion?: string;
  docsProvider?: string | null;
  platformDetected?: string | null;
}

export function detectDocsProvider(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = PLATFORM_PATTERNS.find(
      (item) => item.pattern.test(parsed.hostname) || item.pattern.test(parsed.pathname),
    );
    return match?.name ?? null;
  } catch {
    return null;
  }
}

async function fetchText(url: string, timeoutMs: number): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: "text/html,text/plain",
      "User-Agent": "AgentReady/0.1 (+https://agentready.local)",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export async function detectDocsUrl(url: string): Promise<DocsDetection> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { isLikely: false, warning: "Invalid URL format." };
  }

  const docsProvider = detectDocsProvider(url);
  const host = parsed.hostname;
  const path = parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`;

  if (DOCS_HOST_PREFIX.test(host)) {
    return { isLikely: true, docsProvider, platformDetected: docsProvider };
  }

  if (DOCS_PATH.test(path)) {
    return { isLikely: true, docsProvider, platformDetected: docsProvider };
  }

  if (docsProvider) {
    return { isLikely: true, docsProvider, platformDetected: docsProvider };
  }

  const isRootPath = parsed.pathname === "" || parsed.pathname === "/";
  let hasLlmsTxt = false;

  try {
    const llms = await fetchText(`${parsed.origin}/llms.txt`, 5_000);
    hasLlmsTxt = llms.ok;
  } catch {
    hasLlmsTxt = false;
  }

  if (hasLlmsTxt && !isRootPath) {
    return { isLikely: true, docsProvider, platformDetected: docsProvider };
  }

  try {
    const page = await fetchText(url, 8_000);
    if (!page.ok) {
      return {
        isLikely: false,
        warning: `The URL returned HTTP ${page.status}. Verify that the docs are public.`,
        docsProvider,
        platformDetected: docsProvider,
      };
    }

    const html = await page.text();
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";
    const codeBlockCount = html.match(/<(pre|code)\b/gi)?.length ?? 0;

    if (DOCS_TITLE.test(title)) {
      return { isLikely: true, docsProvider, platformDetected: docsProvider };
    }

    if (codeBlockCount >= 3 || /getting started|api reference|quickstart|sdk reference/i.test(html)) {
      return { isLikely: true, docsProvider, platformDetected: docsProvider };
    }

    const baseDomain = host.replace(/^www\./i, "");
    return {
      isLikely: false,
      warning: "This looks like a marketing or product page, not a documentation page.",
      suggestion: `Try docs.${baseDomain}, ${parsed.origin}/docs, or ${parsed.origin}/api.`,
      docsProvider,
      platformDetected: docsProvider,
    };
  } catch {
    if (hasLlmsTxt) {
      return { isLikely: true, docsProvider, platformDetected: docsProvider };
    }

    return {
      isLikely: false,
      warning: "Could not fetch the URL. It may be private, blocked, or protected by bot checks.",
      suggestion: `Try docs.${host.replace(/^www\./i, "")}.`,
      docsProvider,
      platformDetected: docsProvider,
    };
  }
}
