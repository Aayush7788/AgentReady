const BLOCKED_TLDS = new Set(["adult", "porn", "sex", "xxx"]);

const BLOCKED_DOMAINS = new Set([
  "onlyfans.com",
  "pornhub.com",
  "redtube.com",
  "stripchat.com",
  "xhamster.com",
  "xnxx.com",
  "xvideos.com",
  "youporn.com",
]);

export function isBlockedDomain(input: string): boolean {
  try {
    const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const host = new URL(normalized).hostname.replace(/^www\./i, "").toLowerCase();
    const tld = host.split(".").pop();
    if (tld && BLOCKED_TLDS.has(tld)) return true;
    if (BLOCKED_DOMAINS.has(host)) return true;

    for (const domain of Array.from(BLOCKED_DOMAINS)) {
      if (host.endsWith(`.${domain}`)) return true;
    }

    return false;
  } catch {
    return false;
  }
}
