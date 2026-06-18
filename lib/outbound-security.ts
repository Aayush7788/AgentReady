import { AsyncLocalStorage } from "node:async_hooks";
import { lookup } from "node:dns/promises";
import { createHash } from "node:crypto";
import ipaddr from "ipaddr.js";
import { Agent, fetch as undiciFetch } from "undici";

const MAX_REDIRECTS = 5;
const BLOCKED_HOST_SUFFIXES = [
  ".home.arpa",
  ".internal",
  ".invalid",
  ".local",
  ".localhost",
  ".test",
];

type FetchInput = string | URL | Request;
type AddressResolver = (hostname: string) => Promise<string[]>;
interface SafeFetchContext {
  signal?: AbortSignal;
}

const safeFetchContext = new AsyncLocalStorage<SafeFetchContext>();
const nativeFetch = globalThis.fetch.bind(globalThis);
let safeFetchInstalled = false;

function normalizedAddress(address: string): ipaddr.IPv4 | ipaddr.IPv6 {
  return ipaddr.process(address.split("%")[0]);
}

export function isPublicAddress(address: string): boolean {
  try {
    return normalizedAddress(address).range() === "unicast";
  } catch {
    return false;
  }
}

async function resolvePublicAddresses(hostname: string): Promise<string[]> {
  if (ipaddr.isValid(hostname)) {
    return [hostname];
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses.map((entry) => entry.address);
}

export async function assertPublicHttpUrl(
  input: string | URL,
  resolver: AddressResolver = resolvePublicAddresses,
): Promise<URL> {
  const url = input instanceof URL ? new URL(input) : new URL(input);
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS documentation URLs are supported.");
  }
  if (url.username || url.password) {
    throw new Error("Documentation URLs cannot include credentials.");
  }
  if (url.port) {
    throw new Error("Documentation URLs using custom ports are not supported.");
  }
  if (
    hostname === "localhost" ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    throw new Error("Private or local network addresses cannot be scanned.");
  }
  if (!ipaddr.isValid(hostname) && !hostname.includes(".")) {
    throw new Error("Documentation URLs must use a public hostname.");
  }

  const addresses = await resolver(hostname);
  if (addresses.length === 0 || addresses.some((address) => !isPublicAddress(address))) {
    throw new Error("The documentation hostname resolves to a private or reserved address.");
  }

  return url;
}

const publicNetworkAgent = new Agent({
  connect: {
    lookup(hostname, options, callback) {
      const finish = callback as unknown as (
        error: Error | null,
        address: string | Array<{ address: string; family: number }>,
        family?: number,
      ) => void;

      resolvePublicAddresses(hostname)
        .then((addresses) => {
          if (addresses.length === 0 || addresses.some((address) => !isPublicAddress(address))) {
            finish(new Error("Blocked private or reserved network address."), []);
            return;
          }

          const family = typeof options === "object" ? options.family : undefined;
          const candidates = family
            ? addresses.filter((address) => normalizedAddress(address).kind() === `ipv${family}`)
            : addresses;
          const selected = candidates[0] ?? addresses[0];

          finish(null, [
            {
              address: selected,
              family: normalizedAddress(selected).kind() === "ipv6" ? 6 : 4,
            },
          ]);
        })
        .catch((error) => finish(error as Error, []));
    },
  },
});

function toUrl(input: FetchInput): URL {
  if (typeof input === "string" || input instanceof URL) {
    return new URL(input);
  }
  return new URL(input.url);
}

function isRedirect(status: number): boolean {
  return [301, 302, 303, 307, 308].includes(status);
}

async function fetchPublicResource(
  input: FetchInput,
  init: RequestInit = {},
): Promise<Response> {
  const originalUrl = toUrl(input);
  let currentUrl = await assertPublicHttpUrl(originalUrl);
  let method = init.method ?? (input instanceof Request ? input.method : "GET");
  const redirectMode = init.redirect ?? "follow";
  const contextSignal = safeFetchContext.getStore()?.signal;
  const signal =
    init.signal && contextSignal
      ? AbortSignal.any([init.signal, contextSignal])
      : (init.signal ?? contextSignal);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = (await undiciFetch(currentUrl, {
      ...init,
      method,
      redirect: "manual",
      dispatcher: publicNetworkAgent,
      signal,
    } as never)) as unknown as Response;

    if (!isRedirect(response.status) || redirectMode === "manual") {
      Object.defineProperties(response, {
        redirected: { configurable: true, value: currentUrl.href !== originalUrl.href },
        url: { configurable: true, value: currentUrl.href },
      });
      return response;
    }

    if (redirectMode === "error") {
      throw new Error("Documentation URL redirects are not allowed for this request.");
    }

    const location = response.headers.get("location");
    if (!location) return response;
    if (redirectCount === MAX_REDIRECTS) {
      throw new Error("Documentation URL redirected too many times.");
    }

    await response.body?.cancel();
    currentUrl = await assertPublicHttpUrl(new URL(location, currentUrl));
    if (response.status === 303 || ((response.status === 301 || response.status === 302) && method === "POST")) {
      method = "GET";
    }
  }

  throw new Error("Documentation URL redirected too many times.");
}

function installSafeFetch(): void {
  if (safeFetchInstalled) return;

  globalThis.fetch = ((input: FetchInput, init?: RequestInit) => {
    if (safeFetchContext.getStore() === undefined) {
      return nativeFetch(input, init);
    }
    return fetchPublicResource(input, init);
  }) as typeof globalThis.fetch;
  safeFetchInstalled = true;
}

export function withSafeOutboundFetch<T>(
  work: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  installSafeFetch();
  return safeFetchContext.run({ signal }, work);
}

export function privateScanSlug(url: string): string {
  const parsed = new URL(url);
  const readable = `${parsed.hostname}${parsed.pathname}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52);
  const digest = createHash("sha256").update(url).digest("hex").slice(0, 12);
  return `scan-${readable || "docs"}-${digest}`;
}
